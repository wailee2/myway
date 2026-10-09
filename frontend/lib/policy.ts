/**
 * PROVISIONAL business rules from the roadmap's "Gate" section.
 *
 * Every number and every sentence the rider or driver reads about these rules comes from this file,
 * so the wording is identical on trip detail, checkout, the booking screen and the cancel dialog.
 * Change a rule here once the supervisor signs off the decisions sheet (docs/DECISIONS.md).
 */
export const POLICY = {
  /** "trip" = one fare per trip (built). "segment" = fare by pickup→drop-off distance (switch on only if the Gate requires it). */
  fareModel: "trip" as "trip" | "segment",
  cancelFreeMinutes: 30,
  noShowWaitMinutes: 5,
  meetEarlyMinutes: 5,
  commissionRate: 0.1,
  callLimitMinutes: 3,
  callWindowAfterDropoffMinutes: 30,
  minWithdrawal: 1000,
  freeWithdrawalsPerDay: 1,
  extraWithdrawalFee: 50,
  /** Front seat costs this much more than a back seat. */
  frontSeatPremium: 300,
  /** Held from the wallet to secure a seat when paying the driver in cash. */
  cashHold: 200,
} as const;

export const COPY = {
  /** Same sentence everywhere a cancellation rule is shown. */
  cancellation: `Free cancellation until ${POLICY.cancelFreeMinutes} minutes before pickup. After that, the fare is not refunded.`,
  departure: (time: string) => `The car leaves at ${time}, or sooner if all seats fill. It still leaves if some seats are empty.`,
  noShow: `The driver waits ${POLICY.noShowWaitMinutes} minutes at the stop. If you are not there, the seat is released and the fare is not refunded.`,
  driverCancelled: "If the driver cancels, you get a full refund to your wallet straight away and we show you other rides.",
  calls: `Calls go through MYWAY, so your number stays private. Each call is limited to ${POLICY.callLimitMinutes} minutes and works from booking until ${POLICY.callWindowAfterDropoffMinutes} minutes after drop-off.`,
  seatsNote: "The car carries four passengers at most.",
} as const;
