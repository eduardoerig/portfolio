import bcrypt from "bcryptjs";

// Uso: npm run hash-password -- minha-senha
const senha = process.argv[2];
if (!senha) {
  console.error("Uso: npm run hash-password -- <senha>");
  process.exit(1);
}
// O Next expande "$" no .env, então cada um leva uma barra (aspas não evitam isso).
console.log("ADMIN_PASSWORD_HASH=" + bcrypt.hashSync(senha, 12).split("$").join("\\$"));
