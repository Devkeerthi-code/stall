/** Thrown when a record doesn't exist *or* belongs to another shop. Both look the same to the caller. */
export class NotFoundError extends Error {
  constructor(what = "Not found") {
    super(what);
    this.name = "NotFoundError";
  }
}

export class UserError extends Error {
  constructor(message: string, readonly field?: string) {
    super(message);
    this.name = "UserError";
  }
}
