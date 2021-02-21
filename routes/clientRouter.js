import express from 'express';
import { accountModel } from '../models/accountModel.js';

const app = express();

const withdrawFee = 1;
const transferFee = 8;
const privateAgencyNumber = 99;

// Retrieve
app.get('/accounts', async (req, res) => {
    try {
        const accounts = await accountModel.find({});
        res.send(accounts);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Operação de depósito na conta do cliente
app.put('/account/deposit', async (req, res) => {
    const { agency, account, deposit } = req.body;
    try {
        const targetAccount = await accountModel.findOne({
            agency: agency, account: account
        });

        targetAccount.balance = targetAccount.balance + deposit;
        
        const id = targetAccount._id;
        const updatedAccount = await accountModel.findByIdAndUpdate(
            { _id: id }, { balance: targetAccount.balance }, { new: true });

        res.send(updatedAccount);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Operação de saque na conta do cliente
app.put('/account/withdraw', async (req, res) => {
    const { agency, account, withdraw } = req.body;
    try {
        const targetAccount = await accountModel.findOne({
            agency: agency, account: account
        });

        const accountId = targetAccount._id;
        const balance = targetAccount.balance;

        if (balance < withdraw + withdrawFee)  {
            throw new Error('Saldo Insuficiente.');
        }

        const updatedBalance = balance - withdraw - withdrawFee;
        const updatedAccount = await accountModel.findByIdAndUpdate(
            { _id: accountId }, { balance: updatedBalance }, { new: true }
        );

        res.send(updatedAccount);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Consulta o saldo da conta
app.get('/account/getBalance/:agency/:account', async (req, res) => {
    const { agency, account } = req.params;
    try {
        const targetAccount = await accountModel.findOne({
            agency: agency, account: account
        });

        res.send({ balance: targetAccount.balance });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Exclui uma conta
app.delete('/account/remove/:agency/:account', async (req, res) => {
    const { agency, account } = req.params;
    try {
        const removedAccount = await accountModel.findOneAndDelete({
            agency: agency, account: account
        });

        if (!removedAccount) {
            throw new Error('Impossível remover a conta informada.');
        }

        const accounts = await accountModel.find({ agency: agency });
        
        res.send({ accounts: accounts.length });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Transferências entre contas
app.put('/account/transfer/', async (req, res) => {
    const { toAgency, toAccount, fromAgency, fromAccount, value } = req.body;
    try {
        const originAccount = await accountModel.findOne({
            agency: fromAgency, account: fromAccount
        });
        const destinyAccount = await accountModel.findOne({
            agency: toAgency, account: toAccount
        });

        if (!originAccount || !destinyAccount) {
            throw new Error('Impossível realizar a operação de transferência entre as contas.');
        }

        const fee = (fromAgency === toAgency) ? 0 : transferFee;

        if (originAccount.balance < value + fee) {
            throw new Error('Saldo da conta origem insuficiente.');
        }

        originAccount.balance = originAccount.balance - value - fee;

        destinyAccount.balance = destinyAccount.balance + value;

        originAccount.save();
        destinyAccount.save();

        res.send(originAccount);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Média do saldo das contas de determinada agência
app.get('/account/avgBalance/:agency', async (req, res) => {
    const agency = req.params.agency;

    try {
        const averageBalance = await accountModel.aggregate([
            {
                $match: {
                    agency: parseInt(agency),
                },
            },
            {
                $group: {
                    _id: '$agency',
                    average: {
                        $avg: '$balance',
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    average: 1,
                },
            },
        ]);

        if (averageBalance.length === 0) {
            throw new Error('Impossível calcular média da agência informada.');
        }

        res.send(averageBalance[0]);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Consulta as contas com menor saldo
app.get('/account/getLowerBalances/:limit', async (req, res) => {
    const limit = req.params.limit;

    try {
        const accounts = await accountModel.find().sort({ balance: 1 })
            .limit(parseInt(limit));
        
        if (!accounts) {
            throw new Error('Impossível obter contas com menores saldos.');
        }

        res.send(accounts);        
    } catch (error) {
        res.status(500).send(error);
    }
});

// Consulta as contas com maior saldo
app.get('/account/getGreaterBalances/:limit', async (req, res) => {
    const limit = req.params.limit;

    try {
        const accounts = await accountModel.find().sort({ balance: -1, name: 1 })
            .limit(parseInt(limit));
        
        if (!accounts) {
            throw new Error('Impossível obter contas com maiores saldos.');
        }

        res.send(accounts);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Transfere para conta private
app.put('/account/transferToPrivate', async (req, res) => {

    try {
        const aggregation = await accountModel.aggregate([
            {
                $group: {
                    _id: '$agency',
                    balance: { $max: '$balance' },
                },

            },
        ]);

        for (const aggregationLine of aggregation) {
            const account = await accountModel.findOne({
                agency: aggregationLine._id,
                balance: aggregationLine.balance,
            });

            account.agency = privateAgencyNumber;
            account.save();
        }

        const accounts =  await accountModel.find({ agency: privateAgencyNumber });
        res.send(accounts);
    } catch (error) {
        res.status(500).send(error);
    }
});

export { app as clientRouter };
