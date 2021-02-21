import express from 'express';
import mongoose from 'mongoose';

import { clientRouter } from './routes/clientRouter.js';

(async () => {
    try {
        await mongoose.connect(
            'mongodb://localhost/accounts',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );
        console.log('Conectado ao MongoDB.');
    } catch (error) {
        console.log('Erro ao conectar no MongoDB: ' + error);
    }
})();

const app = express();

app.use(express.json());
app.use(clientRouter);

app.listen(3000, () => console.log('API Iniciada.'));