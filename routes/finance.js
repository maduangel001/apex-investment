// routes/finance.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

/* GET BALANCE */
router.get("/balance", auth, async (req,res)=>{
    const user = await User.findById(req.user.id);
    res.json({balance:user.balance});
});

/* DEPOSIT */
router.post("/deposit", auth, async (req,res)=>{
    const {amount} = req.body;

    const user = await User.findById(req.user.id);
    user.balance += amount;
    await user.save();

    await Transaction.create({
        userId:user._id,
        type:"deposit",
        method:"btc",
        amount,
        status:"Completed"
    });

    res.json({success:true});
});

/* WITHDRAW REQUEST */
router.post("/withdraw", auth, async (req,res)=>{
    const {amount,method} = req.body;

    const user = await User.findById(req.user.id);

    if(amount > user.balance){
        return res.json({msg:"Insufficient balance"});
    }

    await Transaction.create({
        userId:user._id,
        type:"withdraw",
        method,
        amount,
        status:"Pending"
    });

    res.json({success:true});
});

/* GET TRANSACTIONS */
router.get("/transactions", auth, async (req,res)=>{
    const tx = await Transaction.find({userId:req.user.id});
    res.json(tx);
});

/* ADMIN APPROVE */
router.post("/admin/approve/:id", async (req,res)=>{
    const tx = await Transaction.findById(req.params.id);
    const user = await User.findById(tx.userId);

    if(tx.status === "Pending"){
        user.balance -= tx.amount;
        tx.status = "Completed";

        await user.save();
        await tx.save();
    }

    res.json({success:true});
});

module.exports = router;