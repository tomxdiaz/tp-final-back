import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppName(): string {
    return '<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;"><h2>Ando</h2><a href="/docs"><button>Ir a Swagger</button></a></div>';
  }
}
