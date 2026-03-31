// server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ================== MONGODB CONNECT ================== */
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

/* ================== MODELS ================== */

// Balance Model (single global user for now)
const balanceSchema = new mongoose.Schema({
    amount: { type:Number, default:0 }
});
const Balance = mongoose.model("Balance", balanceSchema);

// Withdrawal Model
const withdrawalSchema = new mongoose.Schema({
    amount:Number,
    method:String,
    accountName:String,
    iban:String,
    address:String,
    status:{ type:String, default:"Pending" },
    createdAt:{ type:Date, default:Date.now }
});
const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);


/* ================== INIT BALANCE ================== */
async function initBalance(){
    const existing = await Balance.findOne();
    if(!existing){
        await Balance.create({amount:0});
    }
}
initBalance();


// Add inside server.js

app.post("/api/auth/login", (req,res)=>{
    const {email,password} = req.body;

    if(
        email === process.env.ADMIN_EMAIL &&
        password === process.env.ADMIN_PASSWORD
    ){
        return res.json({ token: "admin-access" });
    }

    res.status(401).json({ message:"Invalid credentials" });
});


/* ================== API ================== */

/* GET BALANCE */
app.get("/api/balance", async (req,res)=>{
    const bal = await Balance.findOne();
    res.json({ balance: bal.amount });
});

/* DEPOSIT */
app.post("/api/deposit", async (req,res)=>{
    const { amount } = req.body;

    if(!amount || amount <= 0){
        return res.status(400).json({ message:"Invalid amount" });
    }

    const bal = await Balance.findOne();
    bal.amount += amount;
    await bal.save();

    res.json({ success:true, balance: bal.amount });
});

/* WITHDRAW REQUEST */
app.post("/api/withdraw", async (req,res)=>{
    const { amount, method, accountName, iban, address } = req.body;

    const bal = await Balance.findOne();

    if(amount > bal.amount){
        return res.status(400).json({ message:"Insufficient balance" });
    }

    const newTx = await Withdrawal.create({
        amount,
        method,
        accountName,
        iban,
        address,
        status:"Pending"
    });

    res.json({ message:"Request submitted", tx:newTx });
});

/* GET WITHDRAWALS */
app.get("/api/withdrawals", async (req,res)=>{
    const txs = await Withdrawal.find().sort({createdAt:-1});
    res.json(txs);
});

/* ADMIN APPROVE */
app.post("/api/approve/:id", async (req,res)=>{
    const tx = await Withdrawal.findById(req.params.id);
    if(!tx) return res.status(404).json({ message:"Not found" });

    if(tx.status !== "Pending"){
        return res.json({ message:"Already processed" });
    }

    // Step 1: Approved
    tx.status = "Approved";
    await tx.save();

    // Step 2: Complete after delay
    setTimeout(async ()=>{
        const bal = await Balance.findOne();

        if(tx.status === "Approved"){
            tx.status = "Completed";
            bal.amount -= tx.amount;

            await tx.save();
            await bal.save();
        }
    }, 5000);

    res.json({ message:"Approved successfully" });
});

/* ================== START SERVER ================== */
app.listen(PORT, ()=>{
    console.log("Server running on port " + PORT);
});



