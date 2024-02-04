export interface TestError {
  /**
   * Error message. Set when [Error] (or its subclass) has been thrown.
   */
  message?: string;

  /**
   * Error stack. Set when [Error] (or its subclass) has been thrown.
   */
  stack?: string;

  /**
   * The value that was thrown. Set when anything except the [Error] (or its subclass) has been thrown.
   */
  value?: string;
}
