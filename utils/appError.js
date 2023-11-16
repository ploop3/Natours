class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    //Stack trace shows us the line the error was originated
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
