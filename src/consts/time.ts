export const MinuteInMs = 60000 as const /* 1_000 * 60 */
export const HourInMs = 3600000 as const /* MinuteInMs * 60 */
export const DayInMs = 86400000 as const /* HourInMs * 24 */
export const SecondInMs = 1000 as const /* 1_000 */
export const WeekInMs = 604800000 as const /* DayInMs * 7 */
export const MonthInMs = 2592000000 as const /* DayInMs * 30 */
export const YearInMs = 31536000000 as const /* DayInMs * 365 */

