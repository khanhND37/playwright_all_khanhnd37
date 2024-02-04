/**
 * Use: get redeem request info
 */
export type RedeemRequest = {
  email: string;
  tierName: string;
  giftName: string;
  status: string;
};

/**
 * Use for product refund
 */
export type ProductRefund = {
  name: string;
  quantity: string | number;
  type: string;
};

/**
 * Use: content of upgrade tier popup
 */
export type UpgradeTierContent = {
  title: string;
  level: string;
  btn_view: boolean;
};

/**
 * Use: get content of How to work section
 */
export type HowToWorkContent = {
  title: string;
  content: string;
};

/**
 *  Use: get content of How to work sections
 */
export type HowToWorkContents = Array<HowToWorkContent>;

/**
 * Use: get content on Progress bar
 */
export type ProgressBarInfo = {
  pecentageComplete: string;
  tooltip: string;
  nextTier: string;
};

/**
 * Use: get benefit of a leve
 */
export type BenefitByLevel = {
  benefit: string;
  active: string;
};

/**
 * Use: get benefit of all level
 */
export type BenefitAllLevel = Array<BenefitByLevel>;

/**
 * User: create message earn more X stars
 * isLevelMax determine level which is max level
 * levelMax is the name of level max
 * curStar determine level which is current tier
 * thresholdNext is threshold of next tier
 * keepThreshold is keep threshold of current tier
 * differenceDay is remaining days of the current cycle
 */
export type MessageEarnMore = {
  isLevelMax: boolean;
  levelMax: string;
  curStar: number;
  thresholdNext: number;
  keepThreshold: number;
  differenceDay: number;
};

/**
 * Use: calculate completion rate to increase rank
 * isLevelMax determine level which is max level
 * curTier determine level which is current tier
 * keepThreshold is keep threshold of current tier
 * thresholdNext is threshold of next tier
 */
export type PercentageCompleted = {
  isLevelMax: boolean;
  curTier: number;
  keepThreshold: number;
  thresholdNext: number;
};
