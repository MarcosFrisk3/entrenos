# EntreNós

Um espaço só de vocês dois.

## O que já funciona (Etapa 1)
- Criar conta com e-mail e senha, com confirmação de 18 anos
- Entrar e recuperar a senha
- Vincular o casal com um código de uso único, válido por 24 horas
- PIN de 4 números, guardado só no aparelho, com bloqueio após 5 erros
- Tela principal com as 4 áreas: Início, Descobrir, Nós Dois e Explorar
- Ajustes: trocar PIN, sair e desfazer o vínculo
- Instalável no celular (PWA)

## Ainda não funciona
- Enviar sinais de desejo (Etapa 2)
- Notificações (Etapa 2)
- Descobertas, jogos, artigos e fotos (etapas seguintes)

## Como testar
1. Publique a pasta (Cloudflare Pages ou GitHub Pages). O app precisa de HTTPS.
2. Abra o endereço no celular.
3. Crie sua conta e confirme o e-mail.
4. Gere o código e peça para a outra pessoa criar a conta dela e usar o código.
5. Cada um cria o seu PIN.

## Arquivos
```
index.html          telas
css/estilo.css      visual
js/config.js        chaves do Supabase
js/conta.js         login e vínculo (único arquivo que muda no app nativo)
js/pin.js           PIN
js/app.js           lógica das telas
sw.js               funcionamento offline e notificações
manifest.json       instalação no celular
icones/             ícone do app
supabase/           SQL do banco de dados
```

## Ao publicar uma versão nova
Troque o número da `VERSAO` no arquivo `sw.js`. Sem isso, o celular continua usando os arquivos antigos.
