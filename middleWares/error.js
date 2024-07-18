class ErrorHandler extends Error{
  constructor(message,statusCode){
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this,this.constructor);   // to preserve the stack trace by the Error class
   // helps us to check where the error occur in the code.
  }
}


export const errorMiddleWare = (err,req,res,next)=>{
    err.message = err.message || "Internal server error "
    err.statusCode = err.statusCode || 500;

    // Wrong mongodb id err
    if(err.name === "CastError"){
      const message = `Resource not found . invalid : ${err.path}`;
      err = new ErrorHandler(message , 404);
    }

    return res.status(err.statusCode).json({
        success: false,
        message : err.message,
    })
} 
export default ErrorHandler;



