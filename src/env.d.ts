/// <reference path="../.astro/types.d.ts" />

import type { Session } from './cms/lib/session';

declare namespace App {
  interface Locals {
    session: Session | undefined;
  }
}

