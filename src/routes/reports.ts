import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as repository from '../db/repository.js';
import { authenticateToken } from '../middleware/auth.js';
import type { CreateReportRequest } from '../types/index.js';

/**
 * Report routes (protected with authentication)
 */
export async function reportRoutes(fastify: FastifyInstance) {
  // Create a new report
  fastify.post<{ Body: CreateReportRequest }>(
    '/reports',
    { preHandler: authenticateToken },
    async (request: FastifyRequest<{ Body: CreateReportRequest }>, reply: FastifyReply) => {
      try {
        const { report } = request.body;
        const userId = request.user!.userId;

        if (!report) {
          return reply.status(400).send({
            error: 'Missing required field: report',
          });
        }

        // Create report for authenticated user
        const savedReport = await repository.createReport(userId, report);

        return reply.status(201).send({
          success: true,
          reportId: savedReport.id,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to save report',
        });
      }
    }
  );

  // Get all reports for a user
  fastify.get<{ Querystring: { limit?: string; offset?: string } }>(
    '/reports',
    { preHandler: authenticateToken },
    async (request, reply) => {
      try {
        const { limit, offset } = request.query;
        const userId = request.user!.userId;

        // Get reports for authenticated user
        const result = await repository.getReportsByUser(
          userId,
          limit ? parseInt(limit, 10) : 50,
          offset ? parseInt(offset, 10) : 0
        );

        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to fetch reports',
        });
      }
    }
  );

  // Get a specific report by ID
  fastify.get<{ Params: { id: string } }>(
    '/reports/:id',
    { preHandler: authenticateToken },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = request.user!.userId;

        const reportId = parseInt(id, 10);
        if (isNaN(reportId)) {
          return reply.status(400).send({
            error: 'Invalid report ID',
          });
        }

        const report = await repository.getReportById(reportId);

        if (!report) {
          return reply.status(404).send({
            error: 'Report not found',
          });
        }

        // Verify ownership
        if (report.user_id !== userId) {
          return reply.status(403).send({
            error: 'Unauthorized',
          });
        }

        return reply.send({ report });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to fetch report',
        });
      }
    }
  );

  // Delete a report
  fastify.delete<{ Params: { id: string } }>(
    '/reports/:id',
    { preHandler: authenticateToken },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = request.user!.userId;

        const reportId = parseInt(id, 10);
        if (isNaN(reportId)) {
          return reply.status(400).send({
            error: 'Invalid report ID',
          });
        }

        // Delete report (ownership is verified in the query)
        const deleted = await repository.deleteReport(reportId, userId);

        if (!deleted) {
          return reply.status(404).send({
            error: 'Report not found or unauthorized',
          });
        }

        return reply.send({
          success: true,
          message: 'Report deleted successfully',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to delete report',
        });
      }
    }
  );

  // Get recent reports (public endpoint for stats)
  fastify.get<{ Querystring: { limit?: string } }>(
    '/reports/recent',
    async (request, reply) => {
      try {
        const { limit } = request.query;
        const reports = await repository.getRecentReports(
          limit ? parseInt(limit, 10) : 10
        );

        return reply.send({ reports });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to fetch recent reports',
        });
      }
    }
  );
}
