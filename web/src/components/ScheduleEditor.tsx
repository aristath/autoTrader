import {
	Badge,
	Checkbox,
	Code,
	Group,
	NumberInput,
	SegmentedControl,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core"

interface TaskSchedulePolicy {
	staleAfterSeconds?: number
	runWhen?: "idle" | "immediate"
	priority?: number
}

function firstNonEmpty(value: string | null | undefined): string | undefined {
	const trimmed = value?.trim()
	return trimmed || undefined
}

type ScheduleMode = "off" | "cron" | "interval"

interface ScheduleUpdate {
	schedule: string | null
	schedulePolicy?: TaskSchedulePolicy
}

const DEFAULT_CRON = "0 9 * * *"
const DEFAULT_INTERVAL_SECONDS = 12 * 60 * 60

const MINUTE_OPTS = [
	{ value: "*", label: "every minute" },
	{ value: "0", label: ":00" },
	{ value: "5", label: ":05" },
	{ value: "10", label: ":10" },
	{ value: "15", label: ":15" },
	{ value: "20", label: ":20" },
	{ value: "30", label: ":30" },
	{ value: "45", label: ":45" },
]

const HOUR_OPTS = [
	{ value: "*", label: "every hour" },
	{ value: "0", label: "midnight" },
	{ value: "1", label: "1 AM" },
	{ value: "2", label: "2 AM" },
	{ value: "3", label: "3 AM" },
	{ value: "4", label: "4 AM" },
	{ value: "5", label: "5 AM" },
	{ value: "6", label: "6 AM" },
	{ value: "7", label: "7 AM" },
	{ value: "8", label: "8 AM" },
	{ value: "9", label: "9 AM" },
	{ value: "10", label: "10 AM" },
	{ value: "11", label: "11 AM" },
	{ value: "12", label: "noon" },
	{ value: "13", label: "1 PM" },
	{ value: "14", label: "2 PM" },
	{ value: "15", label: "3 PM" },
	{ value: "16", label: "4 PM" },
	{ value: "17", label: "5 PM" },
	{ value: "18", label: "6 PM" },
	{ value: "19", label: "7 PM" },
	{ value: "20", label: "8 PM" },
	{ value: "21", label: "9 PM" },
	{ value: "22", label: "10 PM" },
	{ value: "23", label: "11 PM" },
]

const DOM_OPTS = [
	{ value: "*", label: "every day" },
	...Array.from({ length: 31 }, (_, index) => ({ value: String(index + 1), label: ordinal(index + 1) })),
]

const MONTH_OPTS = [
	{ value: "*", label: "every month" },
	{ value: "1", label: "January" },
	{ value: "2", label: "February" },
	{ value: "3", label: "March" },
	{ value: "4", label: "April" },
	{ value: "5", label: "May" },
	{ value: "6", label: "June" },
	{ value: "7", label: "July" },
	{ value: "8", label: "August" },
	{ value: "9", label: "September" },
	{ value: "10", label: "October" },
	{ value: "11", label: "November" },
	{ value: "12", label: "December" },
]

const DOW_OPTS = [
	{ value: "*", label: "every day" },
	{ value: "0", label: "Sunday" },
	{ value: "1", label: "Monday" },
	{ value: "2", label: "Tuesday" },
	{ value: "3", label: "Wednesday" },
	{ value: "4", label: "Thursday" },
	{ value: "5", label: "Friday" },
	{ value: "6", label: "Saturday" },
]

const CRON_FIELDS = [
	{ label: "Minute", options: MINUTE_OPTS, index: 0 },
	{ label: "Hour", options: HOUR_OPTS, index: 1 },
	{ label: "Day", options: DOM_OPTS, index: 2 },
	{ label: "Month", options: MONTH_OPTS, index: 3 },
	{ label: "Weekday", options: DOW_OPTS, index: 4 },
]

export function ScheduleEditor({
	schedule,
	schedulePolicy,
	onUpdate,
	disabled = false,
}: {
	schedule: string | null
	schedulePolicy?: TaskSchedulePolicy
	onUpdate: (next: ScheduleUpdate) => void
	disabled?: boolean
}) {
	const intervalSeconds = schedulePolicy?.staleAfterSeconds ?? DEFAULT_INTERVAL_SECONDS
	const intervalDays = Math.floor(intervalSeconds / 86400)
	const intervalHours = Math.floor((intervalSeconds % 86400) / 3600)
	const intervalMinutes = Math.floor((intervalSeconds % 3600) / 60)
	const mode: ScheduleMode = schedule?.trim()
		? "cron"
		: (schedulePolicy?.staleAfterSeconds ?? 0) > 0
			? "interval"
			: "off"
	const cronParts =
		schedule?.trim()?.split(/\s+/).length === 5 ? schedule.trim().split(/\s+/) : DEFAULT_CRON.split(" ")

	function emit(nextSchedule: string | null, nextPolicy?: TaskSchedulePolicy) {
		onUpdate({
			schedule: nextSchedule,
			schedulePolicy: nextPolicy && Object.keys(nextPolicy).length > 0 ? nextPolicy : undefined,
		})
	}

	function setMode(next: string) {
		if (next === "off") {
			emit(null, undefined)
		} else if (next === "cron") {
			emit(firstNonEmpty(schedule) ?? DEFAULT_CRON, undefined)
		} else {
			emit(null, {
				...(schedulePolicy ?? {}),
				staleAfterSeconds: Math.max(
					1,
					Math.floor(schedulePolicy?.staleAfterSeconds ?? DEFAULT_INTERVAL_SECONDS),
				),
				runWhen: schedulePolicy?.runWhen ?? "idle",
			})
		}
	}

	function partValues(index: number): Set<string> {
		const part = cronParts[index]
		if (!part || part === "*") return new Set(["*"])
		return new Set(part.split(",").filter(Boolean))
	}

	function toggleCronValue(index: number, value: string, checked: boolean) {
		const values = partValues(index)
		if (value === "*") {
			values.clear()
			values.add("*")
		} else if (checked) {
			values.delete("*")
			values.add(value)
		} else {
			values.delete(value)
			if (values.size === 0) values.add("*")
		}
		const parts = [...cronParts]
		parts[index] = values.has("*")
			? "*"
			: [...values].sort((a, b) => Number.parseInt(a) - Number.parseInt(b)).join(",")
		emit(parts.join(" "), undefined)
	}

	function setIntervalSeconds(seconds: number) {
		emit(null, {
			...(schedulePolicy ?? {}),
			staleAfterSeconds: Math.max(1, Math.floor(Number.isFinite(seconds) ? seconds : DEFAULT_INTERVAL_SECONDS)),
			runWhen: schedulePolicy?.runWhen ?? "idle",
		})
	}

	function setIntervalParts(parts: { days?: number; hours?: number; minutes?: number }) {
		const pick = (value: number | undefined, fallback: number) =>
			value !== undefined && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback
		const days = pick(parts.days, intervalDays)
		const hours = pick(parts.hours, intervalHours)
		const minutes = pick(parts.minutes, intervalMinutes)
		setIntervalSeconds(days * 86400 + hours * 3600 + minutes * 60)
	}

	function setRunWhen(value: string | null) {
		emit(null, {
			...(schedulePolicy ?? {}),
			staleAfterSeconds: Math.max(1, Math.floor(schedulePolicy?.staleAfterSeconds ?? DEFAULT_INTERVAL_SECONDS)),
			runWhen: value === "immediate" ? "immediate" : "idle",
		})
	}

	function setPriority(value: string | number) {
		const numeric = numberInputValue(value)
		emit(null, {
			...(schedulePolicy ?? {}),
			staleAfterSeconds: Math.max(1, Math.floor(schedulePolicy?.staleAfterSeconds ?? DEFAULT_INTERVAL_SECONDS)),
			runWhen: schedulePolicy?.runWhen ?? "idle",
			priority: Math.max(-1000, Math.min(1000, Math.floor(numeric ?? 0))),
		})
	}

	return (
		<Stack gap="sm" className="schedule-editor-react">
			<Group justify="space-between" align="center" gap="sm">
				<SegmentedControl
					data={[
						{ label: "Off", value: "off" },
						{ label: "Cron", value: "cron" },
						{ label: "Interval", value: "interval" },
					]}
					value={mode}
					onChange={setMode}
					size="xs"
					disabled={disabled}
				/>
				{mode === "cron" ? (
					<Group gap="xs" wrap="nowrap" className="schedule-summary">
						<Code>{schedule ?? DEFAULT_CRON}</Code>
						<Badge variant="light">{describeCron(cronParts)}</Badge>
					</Group>
				) : null}
			</Group>

			{mode === "cron" ? (
				<Stack gap="sm">
					<TextInput
						label="Cron"
						value={schedule ?? DEFAULT_CRON}
						onChange={(event) => emit(event.currentTarget.value.trim() || DEFAULT_CRON, undefined)}
						disabled={disabled}
					/>
					<Stack gap="xs">
						{CRON_FIELDS.map((field) => {
							const values = partValues(field.index)
							return (
								<div className="cron-field-row" key={field.label}>
									<Text size="xs" fw={800} c="dimmed" tt="uppercase">
										{field.label}
									</Text>
									<div className="cron-option-grid">
										{field.options.map((option) => (
											<Checkbox
											key={option.value}
											size="xs"
											checked={values.has(option.value)}
											disabled={disabled}
												onChange={(event) =>
													toggleCronValue(
														field.index,
														option.value,
														event.currentTarget.checked,
													)
												}
												label={`${option.value === "*" ? "*" : option.value} ${option.label}`}
											/>
										))}
									</div>
								</div>
							)
						})}
					</Stack>
				</Stack>
			) : null}

			{mode === "interval" ? (
				<SimpleGrid cols={{ base: 1, sm: 3, lg: 5 }} spacing="sm">
					<NumberInput
						label="Days"
						min={0}
						step={1}
						value={intervalDays}
						disabled={disabled}
						onChange={(value) => setIntervalParts({ days: numberInputValue(value) })}
					/>
					<NumberInput
						label="Hours"
						min={0}
						max={23}
						step={1}
						value={intervalHours}
						disabled={disabled}
						onChange={(value) => setIntervalParts({ hours: numberInputValue(value) })}
					/>
					<NumberInput
						label="Minutes"
						min={0}
						max={59}
						step={1}
						value={intervalMinutes}
						disabled={disabled}
						onChange={(value) => setIntervalParts({ minutes: numberInputValue(value) })}
					/>
					<Select
						label="Run when"
						data={[
							{ value: "idle", label: "Idle" },
							{ value: "immediate", label: "Immediate" },
						]}
						value={schedulePolicy?.runWhen ?? "idle"}
						disabled={disabled}
						onChange={setRunWhen}
						allowDeselect={false}
					/>
					<NumberInput
						label="Priority"
						step={1}
						value={schedulePolicy?.priority ?? 0}
						disabled={disabled}
						onChange={setPriority}
					/>
				</SimpleGrid>
			) : null}
		</Stack>
	)
}

function ordinal(n: number): string {
	const suffixes = ["th", "st", "nd", "rd"]
	const value = n % 100
	return `${n}${suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]}`
}

function numberInputValue(value: string | number): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function simpleCronPart(part: string): boolean {
	return part === "*" || /^\d+(,\d+)*$/.test(part)
}

function describeCron(parts: string[]): string {
	if (!parts.every(simpleCronPart)) return "custom cron expression"
	const [minute, hour, day, month, weekday] = parts
	const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
	const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	const formatHour = (raw: string) => {
		const h = Number.parseInt(raw)
		const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
		return `${h12}${h < 12 ? "am" : "pm"}`
	}

	if (parts.every((part) => part === "*")) return "every minute"

	let time = "every minute"
	if (minute !== "*" && hour !== "*") {
		const hours = hour.split(",")
		const minutes = minute.split(",")
		if (hours.length === 1 && minutes.length === 1) {
			const h = Number.parseInt(hours[0])
			const m = Number.parseInt(minutes[0])
			const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
			time = `at ${h12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`
		} else {
			time = `at :${minutes.map((m) => m.padStart(2, "0")).join("/")} past ${hours.map(formatHour).join(" & ")}`
		}
	} else if (minute !== "*") {
		time = `at :${minute
			.split(",")
			.map((m) => m.padStart(2, "0"))
			.join("/")} past every hour`
	} else if (hour !== "*") {
		time = `every minute of ${hour.split(",").map(formatHour).join(" & ")}`
	}

	const dayPart =
		weekday !== "*"
			? weekday
					.split(",")
					.map((value) => weekdays[Number.parseInt(value)] ?? value)
					.join(", ")
			: day !== "*"
				? day
						.split(",")
						.map((value) => ordinal(Number.parseInt(value)))
						.join(", ")
				: ""
	const monthPart =
		month !== "*"
			? month
					.split(",")
					.map((value) => months[Number.parseInt(value)] ?? value)
					.join(", ")
			: ""

	return [time, dayPart, monthPart].filter(Boolean).join(" · ")
}
