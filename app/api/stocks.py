"""Stock universe API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from app.database import get_db

router = APIRouter()


@router.get("")
async def get_stocks(db: aiosqlite.Connection = Depends(get_db)):
    """Get all stocks in universe with current scores."""
    cursor = await db.execute("""
        SELECT s.*, sc.technical_score, sc.analyst_score,
               sc.fundamental_score, sc.total_score, sc.calculated_at
        FROM stocks s
        LEFT JOIN scores sc ON s.symbol = sc.symbol
        WHERE s.active = 1
        ORDER BY sc.total_score DESC NULLS LAST
    """)
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


@router.get("/{symbol}")
async def get_stock(symbol: str, db: aiosqlite.Connection = Depends(get_db)):
    """Get detailed stock info with score breakdown."""
    cursor = await db.execute("""
        SELECT s.*, sc.technical_score, sc.analyst_score,
               sc.fundamental_score, sc.total_score, sc.calculated_at
        FROM stocks s
        LEFT JOIN scores sc ON s.symbol = sc.symbol
        WHERE s.symbol = ?
    """, (symbol,))
    row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Stock not found")

    # Get position if any
    cursor = await db.execute("""
        SELECT * FROM positions WHERE symbol = ?
    """, (symbol,))
    position = await cursor.fetchone()

    return {
        **dict(row),
        "position": dict(position) if position else None,
    }


@router.post("/{symbol}/refresh")
async def refresh_stock_score(symbol: str, db: aiosqlite.Connection = Depends(get_db)):
    """Trigger score recalculation for a stock."""
    # Check stock exists
    cursor = await db.execute("SELECT 1 FROM stocks WHERE symbol = ?", (symbol,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Stock not found")

    from app.services.scorer import calculate_stock_score

    score = calculate_stock_score(symbol)
    if score:
        await db.execute(
            """
            INSERT OR REPLACE INTO scores
            (symbol, technical_score, analyst_score, fundamental_score,
             total_score, calculated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                symbol,
                score.technical.total,
                score.analyst.total,
                score.fundamental.total,
                score.total_score,
                score.calculated_at.isoformat(),
            ),
        )
        await db.commit()

        return {
            "symbol": symbol,
            "total_score": score.total_score,
            "technical": score.technical.total,
            "analyst": score.analyst.total,
            "fundamental": score.fundamental.total,
        }

    raise HTTPException(status_code=500, detail="Failed to calculate score")


@router.post("/refresh-all")
async def refresh_all_scores(db: aiosqlite.Connection = Depends(get_db)):
    """Recalculate scores for all stocks in universe."""
    from app.services.scorer import score_all_stocks

    try:
        scores = await score_all_stocks(db)
        return {
            "message": f"Refreshed scores for {len(scores)} stocks",
            "scores": [
                {"symbol": s.symbol, "total_score": s.total_score}
                for s in scores
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
