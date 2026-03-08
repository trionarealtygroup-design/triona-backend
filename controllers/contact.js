const Contact = require("../models/Contact");

exports.submitContact = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        const newContact = new Contact({ name, email, phone, message });
        await newContact.save();
        res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to send message" });
    }
};

exports.getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};
