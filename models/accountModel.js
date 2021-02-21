import mongoose from 'mongoose';

// Definição do Esquema
const accountSchema = mongoose.Schema({
    agency: {
        type: Number,
        required: true,
    },
    account: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        required: true,
        min: 0,
    }
});

const accountModel = mongoose.model('accounts', accountSchema);

export { accountModel };