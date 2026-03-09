import { HACKATHON_SUBMISSION_DEADLINE } from './constants'

export function isAfterDeadline(): boolean {
  return new Date() > HACKATHON_SUBMISSION_DEADLINE
}

export function isBeforeDeadline(): boolean {
  return new Date() <= HACKATHON_SUBMISSION_DEADLINE
}
