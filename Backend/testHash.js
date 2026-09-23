import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';

(async () => {
  const result = await bcrypt.compare(
   "@4321##@",
    process.env.SUPER_ADMIN_PASSWORD_HASH
  );

  console.log(result);
})();
bcrypt.hash("@4321##@", 10).then((hash) => {
    console.log(hash);
});
