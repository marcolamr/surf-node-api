import './util/module-alias';

import { Server } from '@overnightjs/core';
import bodyParser from 'body-parser';
import { Application } from 'express';
import * as database from '@src/database';
import expressPino, { HttpLogger } from 'express-pino-logger';
import cors from 'cors';
import apiSchema from './api.schema.json';
import swaggerUi from 'swagger-ui-express';
import { OpenApiValidator } from 'express-openapi-validator';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { ForecastController } from '@src/controllers/forecast';
import { BeachesController } from '@src/controllers/beaches';
import { UsersController } from '@src/controllers/users';
import logger from './logger';
import { apiErrorValidator } from '@src/middlewares/api-error-validator';

export class SetupServer extends Server {
  constructor(private port = 3000) {
    super();
  }

  public async init(): Promise<void> {
    this.setupExpress();
    await this.setupDocs();
    this.setupControllers();
    await this.setupDatabase();
    this.setupErrorHandlers();
  }

  public getApp(): Application {
    return this.app;
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Server listening on port: ${this.port}`);
    });
  }

  public async close(): Promise<void> {
    await database.close();
  }

  private setupExpress(): void {
    this.app.use(bodyParser.json());
    this.app.use(
      expressPino({
        logger: logger as any,
      })
    );
    this.app.use(
      cors({
        origin: '*',
      })
    );
  }

  private setupControllers(): void {
    const forecastController = new ForecastController();
    const beachesController = new BeachesController();
    const usersController = new UsersController();
    this.addControllers([
      forecastController,
      beachesController,
      usersController,
    ]);
  }

  private async setupDatabase(): Promise<void> {
    await database.connect();
  }

  private setupErrorHandlers(): void {
    this.app.use(apiErrorValidator);
  }

  private async setupDocs(): Promise<void> {
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(apiSchema));

    await new OpenApiValidator({
      apiSpec: apiSchema as OpenAPIV3.Document,
      validateRequests: false,
      validateResponses: false,
    }).install(this.app);
  }
}
