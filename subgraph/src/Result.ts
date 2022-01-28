export class Result {
  _error: string;

  constructor(error: string = "") {
    this._error = error;
  }

  get isError(): boolean {
    return this._error.length > 0;
  }

  get error(): string {
    return this._error;
  }
}
