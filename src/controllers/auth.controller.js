
import userModel from "../models/user.model.js";
import { sendMail  } from "../services/mail.service.js";
import jwt from "jsonwebtoken";
import { addTokenToBlacklist } from "../services/redis.service.js";

async function registerController(req,res) {
    const { username, email, password } = req.body;

    const isUserExist = await userModel.findOne({
        $or: [
            { email: email },
            { username: username }
        ]
    })
    

    if(isUserExist) {
        return res.status(400).json({
            success: false,
            message: "User with this email or username already exists",
            error: "User already exists"
        })
    }

    const token = jwt.sign(
        {email:email},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )


    const user = await userModel.create({
        username,
        email,
        password
    })


    await sendMail({
        to:email,
        subject:"welcome to Flash",
        html:`            <h1>Welcome to Flash, ${username}!</h1>
            <p>Thank you for registering with us. We're excited to have you on board!</p>
            <a href="https://flash-zzqe.onrender.com/api/auth/verify-email?token=${token}">Click here to verify your email</a>
            <p>Feel free to explore our platform and let us know if you have any questions.</p>
            <p>Best regards,<br/>The Flash Team</p>
        `
    })


    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

async function loginController(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password",
      error: "User not found"
    })
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
      error: "Invalid credentials"
    })
  }

  if (!user.verified) {
   
    const verifyToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    await sendMail({
      to: user.email,
      subject: "Verify your email — Flash",
      html: `
        <h1>Hey ${user.username}, verify your email</h1>
        <p>You tried to log in but your email isn't verified yet.</p>
        <a href="https://flash-zzqe.onrender.com/api/auth/verify-email?token=${verifyToken}">
          Click here to verify your email
        </a>
      `
    })

    return res.status(401).json({
      success: false,
      message: "Email not verified. A verification link has been sent to your email.",
      error: "email not verified"
    })
  }

  // ✅ auth token only issued after all checks pass
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  )

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}


async function emailResendController(req,res) {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if(!user){  
        return res.status(400).json({
            success: false,
            message: "User with this email does not exist",
            error: "User not found"
        })
    }

    if(user.verified){
        return res.status(400).json({
            success: false,
            message: "Email is already verified",
            error: "Email already verified"
        })
    }

    const token = jwt.sign(
        {email:email},
        process.env.JWT_SECRET,
    )   

    await sendMail({
        to:email,
        subject:"welcome to Flash",    
        html:`            <h1>Welcome to Flash, ${user.username}!</h1>
        <p>Thank you for registering with us. We're excited to have you on board!</p>
        <a href="https://flash-zzqe.onrender.com/api/auth/verify-email?token=${token}">Click here to verify your email</a>
        <p>Feel free to explore our platform and let us know if you have any questions.</p>
        <p>Best regards,<br/>The Flash Team</p>
    `
    })
}

async function getMe(req,res) {

    const user = req.user;
    

     const dbUser = await userModel.findById(user.id).select("-password");

        res.status(200).json({  
            success: true,
            message: "User details fetched successfully",
            user: dbUser
        })

    
}

async function verifyEmailController(req,res) {
    const { token } = req.query;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findOne({ email: decoded.email });

    if(!user){
        return res.status(400).json({
            success: false,
            message: "Invalid token",
            error: "User not found"
        })
    }

    const verifiedHtml = `            <h1>Email already Verified !</h1>
         
        `

    if(user.verified){
        return res.status(200).send(verifiedHtml)
    }

    user.verified = true;
    await user.save();

    const html = `            <h1>Email Verified Successfully!</h1>
            <p>Thank you for verifying your email. Your account is now active.</p>
            <p>You can now log in to your account and start using our services.</p>
            <p>Best regards,<br/>The Flash Team</p>
        `

        res.status(200).send(html);

}


async function logoutController(req, res) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token found",
        error: "Token not provided"
      });
    }

    // Add token to Redis blacklist for 7 days
    await addTokenToBlacklist(token, 7 * 24 * 60 * 60);

    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message
    });
  }
}



export {
    registerController,
    emailResendController,
    verifyEmailController,
    loginController,
    getMe,
    logoutController
}