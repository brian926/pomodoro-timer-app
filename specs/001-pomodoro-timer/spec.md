# Feature Specification: Custom Pomodoro Timer

**Feature Branch**: `001-pomodoro-timer`
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "Build an application that is a pomodoro app. However, the user should start the 'Working' timer and it should continue and not switch to the 'Break' timer until the user manually stops it. The 'Break' timer should then be calculated by the amount of time the 'Working' timer has spent. Every 25 mins of 'Working' should add 5 mins to the 'Break' timer and after every 100 mins of 'Working' then 15 mins should be added to the 'Break' timer. There should also be an option to 'Pause' the timers along with 'Stop'. Base the design around pomofocus.io."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a Working Session (Priority: P1)

As a user, I want to start a working session that runs until I decide to stop it, so I can work at my own pace without an automatic timer switch interrupting my focus.

**Why this priority**: This is the foundational interaction — all other features depend on the Working timer.

**Independent Test**: Start the Working timer, observe it counting up, pause and resume it, then stop it. Verify the break bank is calculated and displayed before any other feature is exercised.

**Acceptance Scenarios**:

1. **Given** the app is loaded and no timer is running, **When** I click Start, **Then** the Working timer begins counting up from 0:00:00 and the button changes to Pause.
2. **Given** the Working timer is running, **When** I click Pause, **Then** the timer freezes at its current value and a Resume button appears.
3. **Given** the Working timer is paused, **When** I click Resume, **Then** the timer continues from where it left off.
4. **Given** the Working timer is running or paused, **When** I click Stop, **Then** the Working timer halts, the break bank is calculated, and the banked break time is displayed.

---

### User Story 2 - Take a Proportional Break (Priority: P2)

As a user, I want to start a Break timer whose duration is derived from how long I worked, so my rest is proportional to my effort.

**Why this priority**: The break-bank calculation is the primary differentiator of this app; without it the core value proposition is missing.

**Independent Test**: Complete working sessions of various lengths (25 min, 50 min, 100 min), verify the break bank matches the expected duration, start the Break timer, observe it count down to zero, and confirm the alert fires.

**Acceptance Scenarios**:

1. **Given** I stopped a 25-minute working session, **When** I view the break bank, **Then** it shows 5 minutes available.
2. **Given** I stopped a 50-minute working session, **When** I view the break bank, **Then** it shows 10 minutes available.
3. **Given** I stopped a 100-minute working session, **When** I view the break bank, **Then** it shows 30 minutes — the 15-minute long break replaces the 4th short break (3 × 5 minutes + 1 × 15 minutes).
4. **Given** break time is banked, **When** I click Start Break, **Then** the Break timer counts down from the banked duration.
5. **Given** the Break timer is running, **When** I click Pause, **Then** the Break timer freezes.
6. **Given** the Break timer is running or paused, **When** I click Stop, **Then** the Break timer stops and any remaining break time is forfeit.
7. **Given** the Break timer reaches 0:00, **Then** an audible alert fires and the timer stops automatically.

---

### User Story 3 - Review Daily Progress (Priority: P3)

As a user, I want to see a daily summary of total work time and total break time taken, so I can understand my productivity at a glance.

**Why this priority**: Adds motivational value but is not required for the timer to function as an MVP.

**Independent Test**: Complete one or more work/break cycles and verify the stats panel reflects accurate totals. Confirm stats reset on a new calendar day without needing any other feature.

**Acceptance Scenarios**:

1. **Given** I have completed at least one working session today, **When** I view the stats panel, **Then** I see total accumulated work time and total break time consumed today.
2. **Given** a new calendar day begins, **Then** daily stats reset to zero automatically.

---

### Edge Cases

- What happens if I stop the Working timer before completing 25 minutes? Partial break credit is awarded proportionally at the rate applicable to the current block being earned (e.g., 10 minutes of work earns 2 minutes of break).
- What happens if I start the Break timer when the break bank is zero? The timer does not start; a message informs the user no break has been earned.
- What happens if I stop the Break timer early? Remaining break time is forfeit and does not carry forward.
- What happens if I start a new working session while break time is still banked? The banked time from the previous session is forfeit and a new bank starts fresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to start a Working timer that counts upward from 0:00:00 with no preset maximum duration.
- **FR-002**: System MUST allow users to Pause the Working timer, freezing it at its current value without resetting it.
- **FR-003**: System MUST allow users to Resume a paused Working timer, continuing from where it was paused.
- **FR-004**: System MUST allow users to Stop the Working timer at any time, ending the working session and triggering break bank calculation.
- **FR-005**: System MUST calculate the break bank upon stopping the Working timer using the following rule: working time is divided into 25-minute blocks, cycling through 100-minute periods. The first three blocks in each 100-minute cycle each earn 5 minutes of break. The fourth block (minutes 75–100 of each cycle) earns 15 minutes of break, replacing the standard 5-minute short break for that slot. Partial blocks earn break credit proportionally at the rate of the block currently being accrued (5 min/25 min for short blocks, 15 min/25 min for the long block).
- **FR-006**: System MUST display the calculated break bank duration immediately after the Working timer is stopped.
- **FR-007**: System MUST NOT automatically switch from Working mode to Break mode; the transition MUST require explicit user action.
- **FR-008**: System MUST allow users to start a Break timer that counts down from the full banked break duration.
- **FR-009**: System MUST allow users to Pause and Resume the Break timer.
- **FR-010**: System MUST allow users to Stop the Break timer early; any remaining break time is forfeit.
- **FR-011**: System MUST play an audible alert when the Break timer reaches zero and stop the timer automatically.
- **FR-012**: System MUST display a daily stats panel showing total work time and total break time consumed for the current calendar day.
- **FR-013**: System MUST reset daily statistics at the start of each new calendar day.

### Key Entities

- **WorkSession**: A single working interval with a start timestamp, an end timestamp, total elapsed duration, and calculated break credit.
- **BreakBank**: The accumulated, unconsumed break time available to the user, derived from the most recent completed WorkSession.
- **BreakSession**: A single break interval with its starting duration, elapsed countdown, and end state (completed vs. stopped early).
- **DailyStats**: Aggregate totals for all WorkSessions and BreakSessions within a single calendar day.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can start, pause, and stop the Working timer in ≤2 interactions.
- **SC-002**: The break bank duration is calculated and displayed within 1 second of the user stopping the Working timer.
- **SC-003**: The Break timer countdown remains accurate to within ±1 second over the full break duration.
- **SC-004**: The application loads and is fully interactive in under 2 seconds on a standard broadband connection.
- **SC-005**: All interactive controls are operable via keyboard alone, meeting WCAG 2.1 AA accessibility standards.
- **SC-006**: The audible end-of-break alert fires within 500 milliseconds of the Break timer reaching zero.
- **SC-007**: The timer display updates at least once per second so users always see an accurate elapsed/remaining time.

## Assumptions

- The Working timer is a count-UP display with no configurable preset limit; users decide when their session ends.
- The Break timer is a count-DOWN display starting from the total banked break duration.
- Break credit is proportional for any duration of work — no minimum threshold applies. A session shorter than 25 minutes earns break time at the short-block rate (5 min per 25 min, or 0.2 min of break per min of work).
- Break bank does not carry over between working sessions; starting a new session forfeits any previously unused break time.
- Session data is stored locally in the browser; no user account or cloud synchronization is required.
- The visual design follows pomofocus.io conventions: a centered large timer display, tab-style mode switching between Working and Break, a muted background color shift between modes, and a clean minimal layout.
- Audio alerts use the browser's built-in audio capabilities with a default chime sound.
- The application targets modern desktop and mobile browsers (no native app required for v1).
