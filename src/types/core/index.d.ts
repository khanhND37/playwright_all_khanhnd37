export * from "./fixture";
export * from "./reporter";
export * from "./pages";
export * from "./testhub";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router: any;
  }
}
