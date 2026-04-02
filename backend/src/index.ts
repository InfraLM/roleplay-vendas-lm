import app from './app';
import { env } from './config/env';

const PORT = parseInt(env.PORT);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
