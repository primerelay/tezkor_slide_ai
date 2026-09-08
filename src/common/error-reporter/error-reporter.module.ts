import { Global, Module } from '@nestjs/common';
import { ErrorReporterService } from './error-reporter.service';

// Global so the service can be injected anywhere and fetched in main.ts for
// the custom logger + process-level crash handlers.
@Global()
@Module({
  providers: [ErrorReporterService],
  exports: [ErrorReporterService],
})
export class ErrorReporterModule {}
