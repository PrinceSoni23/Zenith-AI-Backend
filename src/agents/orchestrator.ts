import { AgentInput, AgentOutput } from "./base.agent";
import { classTranslatorAgent } from "./classTranslator.agent";
import { smartNotesAgent } from "./smartNotes.agent";
import { studyPlannerAgent } from "./studyPlanner.agent";
import { storyModeAgent } from "./storyMode.agent";
import { revisionAgent } from "./revision.agent";
import { writingCoachAgent } from "./writingCoach.agent";
import { mathsSolverAgent } from "./mathsSolver.agent";
import { questionGeneratorAgent } from "./questionGenerator.agent";
import { parentInsightAgent } from "./parentInsight.agent";
import { mentorAgent } from "./mentor.agent";
import { visionLensAgent } from "./visionLens.agent";
import { logger } from "../utils/logger";

export type AgentType =
  | "class-translator"
  | "smart-notes"
  | "study-planner"
  | "story-mode"
  | "revision"
  | "writing-coach"
  | "maths-solver"
  | "question-generator"
  | "parent-insight"
  | "mentor"
  | "vision-lens";

const agentRegistry: Record<
  AgentType,
  (input: AgentInput) => Promise<AgentOutput>
> = {
  "class-translator": classTranslatorAgent,
  "smart-notes": smartNotesAgent,
  "study-planner": studyPlannerAgent,
  "story-mode": storyModeAgent,
  revision: revisionAgent,
  "writing-coach": writingCoachAgent,
  "maths-solver": mathsSolverAgent,
  "question-generator": questionGeneratorAgent,
  "parent-insight": parentInsightAgent,
  mentor: mentorAgent,
  "vision-lens": visionLensAgent,
};

export class AIOrchestrator {
  /**
   * Central dispatcher — routes requests to the correct AI agent
   */
  static async dispatch(
    agentType: AgentType,
    input: AgentInput,
  ): Promise<AgentOutput> {
    const agent = agentRegistry[agentType];

    if (!agent) {
      logger.error(`Unknown agent type: ${agentType}`);
      return {
        success: false,
        agentName: agentType,
        data: {},
        error: `Unknown agent: ${agentType}`,
        processingTime: 0,
      };
    }

    logger.info(
      `[Orchestrator] Dispatching to ${agentType} agent for user ${input.userId}`,
    );

    try {
      const result = await agent(input);
      logger.info(
        `[Orchestrator] ${agentType} completed in ${result.processingTime}ms - success: ${result.success}`,
      );
      return result;
    } catch (error) {
      logger.error(`[Orchestrator] ${agentType} agent failed:`, error);
      return {
        success: false,
        agentName: agentType,
        data: {},
        error: String(error),
        processingTime: 0,
      };
    }
  }

  /**
   * Auto-detect which agent to use based on context
   */
  static detectAgent(context: {
    hasClassContent?: boolean;
    hasNotes?: boolean;
    hasMathProblem?: boolean;
    hasWriting?: boolean;
    isParent?: boolean;
    requestType?: string;
  }): AgentType {
    if (context.requestType) {
      return context.requestType as AgentType;
    }
    if (context.isParent) return "parent-insight";
    if (context.hasMathProblem) return "maths-solver";
    if (context.hasNotes) return "smart-notes";
    if (context.hasClassContent) return "class-translator";
    if (context.hasWriting) return "writing-coach";
    return "mentor";
  }

  /**
   * Run daily flow: mentor suggestion + daily tasks
   */
  static async runDailyFlow(input: AgentInput): Promise<{
    mentorMessage: AgentOutput;
    dailyTasks: AgentOutput;
  }> {
    const [mentorMessage, dailyTasks] = await Promise.all([
      this.dispatch("mentor", input),
      this.dispatch("study-planner", input),
    ]);

    return { mentorMessage, dailyTasks };
  }
}
