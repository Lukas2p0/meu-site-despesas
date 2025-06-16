const express = require('express');
const app = express();
const port = 3000; // No Vercel, a porta é gerida automaticamente

app.use(express.static('public'));

app.get('/', (req, res) => {
  // O Vercel serve o index.html da pasta 'public' automaticamente
  // por isso esta rota é opcional, mas podemos mantê-la.
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});
