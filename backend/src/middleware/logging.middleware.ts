import morgan from 'morgan';
import { env } from '../config/env';

export const httpLogger = morgan(
  env.NODE_ENV === 'production'
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
    : ':method :url :status :response-time ms - :res[content-length]'
);
