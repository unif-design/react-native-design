class ForbidOnlyReporter {
  onRunComplete(_contexts, results) {
    const skipped = results.numPendingTests ?? 0;
    const todo = results.numTodoTests ?? 0;
    if (skipped > 0 || todo > 0) {
      const message = `[forbidOnly] example Jest 禁止 focused/skipped/todo tests：skipped=${skipped} todo=${todo}`;
      process.stderr.write(`${message}\n`);
      this.error = new Error(message);
    }
  }

  getLastError() {
    return this.error;
  }
}

module.exports = ForbidOnlyReporter;
