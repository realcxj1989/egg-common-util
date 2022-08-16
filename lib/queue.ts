import BaseQueue, {
  Queue as BullQueue,
  Job,
  QueueOptions,
  JobOptions,
  JobStatus,
} from 'bull';
import { Application, Router } from 'egg';

const TASK_REDIS_PREFIX = 'task';

const queueMap = new Map<string, BullQueue>();

class QueueBase<T, A extends Application = Application> {
  protected queue: BullQueue<T>;
  protected logger: any;
  protected app: A;
  protected name: string;

  constructor(
    app: A,
    queueOptions: QueueOptions = {},
    name?: string,
    listenEvents: boolean = true
  ) {
    this.app = app;
    this.logger = app.logger;
    this.name = name;

    this.initQueue(queueOptions, listenEvents);
  }

  private initQueue(
    queueOptions: QueueOptions = {},
    listenEvents: boolean = true
  ) {
    const queueName = this.name ?? this.constructor.name;

    if (queueMap.has(queueName)) {
      this.queue = queueMap.get(queueName);
      return;
    }

    const queue = new BaseQueue(queueName, {
      redis: this.app.config.redis.client,
      prefix: TASK_REDIS_PREFIX,
      ...queueOptions,
    });

    this.queue = queue;

    queueMap.set(queueName, queue);

    if (!listenEvents) {
      this.logger.info(`[queue] ${queueName} no need listen events`);
      return;
    }

    this.logger.info(`[queue] ${queueName} listen events`);

    // Listen to Queue events
    queue.on('paused', () => {
      this.logger.info(`[queue] ${queueName} queue paused`);
    });
    queue.on('resumed', (job: Job) => {
      this.logger.info(`[queue] ${queueName} queue resumed`, { job });
    });
    queue.on('cleaned', (jobs: Job[], type: JobStatus) => {
      this.logger.info(`[queue] ${queueName} queue cleaned`, { jobs, type });
    });
    queue.on('drained', () => {
      this.logger.info(`[queue] ${queueName} queue drained`);
    });
    queue.on('error', (error: Error) => {
      this.logger.error(error, { queueName });
    });

    queue.on('failed', (job: Job, error: Error) => {
      this.logger.error(
        `[queue] ${queueName} job failed, ${JSON.stringify(job)} `,
        error
      );
    });
  }
}

export abstract class Queue<
  T,
  R = any,
  A extends Application = Application
> extends QueueBase<T, A> {
  startProcess() {
    this.queue.process((job) => this.process(job.data));
  }

  protected abstract process(params: T): Promise<R>;

  /**
   * @deprecated use send
   * @param ctx
   * @param params
   * @param jobOptions
   * @returns
   */
  async run(ctx: any, params: T, jobOptions: JobOptions = {}) {
    return this.send(ctx, params, jobOptions);
  }

  async send(ctx: any, params: T, jobOptions: JobOptions = {}) {
    return this.queue
      .add(params, {
        ...jobOptions,
        removeOnComplete: true,
      })
      .then((job) => {
        ctx.logger.info(
          `${this.name} ${job.id} job scheduled`,
          JSON.stringify({
            params,
            jobOptions,
          })
        );
      });
  }
}

export class Sender<T, A extends Application = Application> extends Queue<
  T,
  any,
  A
> {
  constructor(app: A, queueOptions: QueueOptions = {}, name?: string) {
    super(app, queueOptions, name, false);
  }

  override startProcess() {
    throw new Error('sender should not call startProcess method');
  }

  // eslint-disable-next-line
  override async process(params: T): Promise<any> {
    throw new Error('sender should not call process method');
  }
}

export class QueueAdmin {
  static async getStats(qName: string) {
    const queue = queueMap.get(qName);
    if (!queue) return null;
    return queue.getJobCounts();
  }

  static async getAllStats() {
    return Promise.all(
      [...queueMap.keys()].map(async (k) => ({
        queueName: k,
        stats: await QueueAdmin.getStats(k),
      }))
    );
  }

  static async pause(qName: string) {
    const queue = queueMap.get(qName);
    if (!queue) return null;
    return queue.pause();
  }

  static async resume(qName: string) {
    const queue = queueMap.get(qName);
    if (!queue) return null;
    return queue.resume();
  }

  static async getFailed(qName: string, start?: number, end?: number) {
    const queue = queueMap.get(qName);
    if (!queue) return null;
    return queue.getFailed(start, end);
  }
}

const withPrefix = (path: string, prefix: string) => `${prefix}${path}`;

export const registryAdminRouter = (rp: Router, pathPrefix: string) => {
  rp.get(withPrefix('', pathPrefix), async (ctx) => {
    ctx.body = `
GET ${withPrefix('/stats', pathPrefix)}?qName={qName}
GET ${withPrefix('/allStats', pathPrefix)}
GET ${withPrefix('/pause', pathPrefix)}?qName={qName}
GET ${withPrefix('/resume', pathPrefix)}?qName={qName}
GET ${withPrefix('/failed', pathPrefix)}?qName={qName}&start={start}&end={end}
`;
  });

  rp.get(withPrefix('/stats', pathPrefix), async (ctx) => {
    const { qName } = ctx.request.query;
    ctx.body = await QueueAdmin.getStats(qName);
  });

  rp.get(withPrefix('/allStats', pathPrefix), async (ctx) => {
    ctx.body = await QueueAdmin.getAllStats();
  });

  rp.get(withPrefix('/pause', pathPrefix), async (ctx) => {
    const { qName } = ctx.request.query;
    ctx.body = await QueueAdmin.pause(qName);
  });

  rp.get(withPrefix('/resume', pathPrefix), async (ctx) => {
    const { qName } = ctx.request.query;
    ctx.body = await QueueAdmin.resume(qName);
  });

  rp.get(withPrefix('/failed', pathPrefix), async (ctx) => {
    const { qName, start, end } = ctx.request.query;
    ctx.body = await QueueAdmin.getFailed(
      qName,
      start && parseInt(start, 10),
      end && parseInt(end, 10)
    );
  });
};
