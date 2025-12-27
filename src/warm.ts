let privyWarmPromise: Promise<unknown> | null = null;
let privyAppWarmPromise: Promise<unknown> | null = null;

export function warmPrivy() {
  if (!privyWarmPromise) {
    privyWarmPromise = import('@privy-io/react-auth');
  }
  return privyWarmPromise;
}

export function warmPrivyApp() {
  if (!privyAppWarmPromise) {
    privyAppWarmPromise = import('./PrivyApp');
  }
  return privyAppWarmPromise;
}

