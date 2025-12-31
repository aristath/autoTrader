"""Product Type value object for financial instruments."""

from enum import Enum


class ProductType(Enum):
    """Type of financial product/instrument.

    Used to distinguish between different tradable instruments:
    - EQUITY: Individual stocks/shares
    - ETF: Exchange Traded Funds
    - ETC: Exchange Traded Commodities
    - MUTUALFUND: Mutual funds (some UCITS products)
    - UNKNOWN: Cannot determine type
    """

    EQUITY = "EQUITY"
    ETF = "ETF"
    ETC = "ETC"
    MUTUALFUND = "MUTUALFUND"
    UNKNOWN = "UNKNOWN"

    @classmethod
    def from_string(cls, value: str) -> "ProductType":
        """Convert string to ProductType enum.

        Args:
            value: String representation of product type

        Returns:
            ProductType enum value

        Raises:
            ValueError: If value is not a valid ProductType
        """
        try:
            return cls(value.upper())
        except (ValueError, AttributeError):
            return cls.UNKNOWN

    @classmethod
    def from_yahoo_quote_type(
        cls, quote_type: str, product_name: str = ""
    ) -> "ProductType":
        """Detect product type from Yahoo Finance quoteType with heuristics.

        Yahoo Finance provides a quoteType field, but it's not always accurate:
        - EQUITY: Regular stocks (reliable)
        - ETF: Most ETFs (reliable)
        - MUTUALFUND: Can be UCITS ETFs or actual mutual funds or ETCs

        We use heuristics on the product name to distinguish ETCs from other MUTUALFUND types.

        Args:
            quote_type: Yahoo Finance quoteType value
            product_name: Product name for heuristic detection

        Returns:
            Detected ProductType
        """
        if not quote_type:
            return cls.UNKNOWN

        quote_type = quote_type.upper()

        # Direct mappings
        if quote_type == "EQUITY":
            return cls.EQUITY
        elif quote_type == "ETF":
            return cls.ETF
        elif quote_type == "MUTUALFUND":
            # Use heuristics to distinguish ETCs from ETFs/Mutual Funds
            name_upper = product_name.upper() if product_name else ""

            # ETC indicators: commodity names or "ETC" in name
            etc_indicators = [
                "ETC",
                "COMMODITY",
                "COMMODITIES",
                "GOLD",
                "SILVER",
                "PLATINUM",
                "PALLADIUM",
                "COPPER",
                "ALUMINIUM",
                "ALUMINUM",
                "OIL",
                "CRUDE",
                "BRENT",
                "WTI",
                "NATURAL GAS",
                "CORN",
                "WHEAT",
                "SOYBEAN",
            ]

            if any(indicator in name_upper for indicator in etc_indicators):
                return cls.ETC

            # ETF indicators: "ETF" explicitly in name
            if "ETF" in name_upper:
                return cls.ETF

            # Default to MUTUALFUND if no clear indicators
            return cls.MUTUALFUND
        else:
            # Other types (INDEX, CURRENCY, etc.) - return UNKNOWN
            return cls.UNKNOWN
