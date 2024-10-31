import env from '@/lib/env';
import { ssoManager } from '@/lib/jackson/sso';
import { ssoVerifySchema, validateWithSchema } from '@/lib/zod';
import { Team } from '@prisma/client';
import { getTeam, getTeams } from 'models/team';
import { getUser } from 'models/user';
import { NextApiRequest, NextApiResponse } from 'next';

const sso = ssoManager();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (err: any) {
    console.error('Error in SSO verify handler:', err);
    res.status(err.status || 400).json({
      error: { message: err.message || 'An unexpected error occurred' },
    });
  }
}

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  const { slug, email } = validateWithSchema(
    ssoVerifySchema,
    typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  );

  if (!slug && !email) {
    return res.status(400).json({ error: 'Either slug or email is required' });
  }

  try {
    // If slug is provided, verify SSO connections for the team
    if (slug) {
      const team = await getTeam({ slug });
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const data = await handleTeamSSOVerification(team.id);
      return res.json({ data });
    }

    // If email is provided, verify SSO connections for the user
    if (email) {
      const teams = await getTeamsFromEmail(email);
      
      // Single team case
      if (teams.length === 1) {
        const data = await handleTeamSSOVerification(teams[0].id);
        return res.json({ data });
      }

      const { teamId, useSlug } = await processTeamsForSSOVerification(teams);

      // Multiple teams with SSO connections found
      if (useSlug) {
        return res.json({
          data: { useSlug },
        });
      }

      // No teams with SSO connections found
      if (!teamId) {
        return res.status(404).json({ 
          error: 'No SSO connections found for any team' 
        });
      }

      // Single team with SSO connection found
      return res.json({
        data: { teamId },
      });
    }
  } catch (err: any) {
    console.error('Error in handlePOST:', err);
    throw err;
  }
};

/**
 * Handle SSO verification for given team id
 */
async function handleTeamSSOVerification(teamId: string) {
  if (!teamId) {
    throw new Error('Team ID is required');
  }

  const exists = await teamSSOExists(teamId);
  if (!exists) {
    throw new Error('No SSO connections found for this team');
  }

  return { teamId };
}

/**
 * Get list of teams for a user from email
 */
async function getTeamsFromEmail(email: string): Promise<Team[]> {
  if (!email) {
    throw new Error('Email is required');
  }

  const user = await getUser({ email });
  if (!user) {
    throw new Error('User not found');
  }

  const teams = await getTeams(user.id);
  if (!teams?.length) {
    throw new Error('User does not belong to any team');
  }

  return teams;
}

/**
 * Check if SSO connections exist for a team
 */
async function teamSSOExists(teamId: string): Promise<boolean> {
  if (!teamId) return false;

  try {
    const connections = await sso.getConnections({
      tenant: teamId,
      product: env.jackson.productId,
    });

    return Array.isArray(connections) && connections.length > 0;
  } catch (err) {
    console.error('Error checking team SSO:', err);
    return false;
  }
}

/**
 * Process teams to find the team with SSO connections
 * Returns:
 * - useSlug: true if multiple teams with SSO found
 * - teamId: ID of single team with SSO, or empty if none/multiple
 */
async function processTeamsForSSOVerification(teams: Team[]): Promise<{
  teamId: string;
  useSlug: boolean;
}> {
  if (!teams?.length) {
    return { teamId: '', useSlug: false };
  }

  let teamId = '';
  
  for (const team of teams) {
    const exists = await teamSSOExists(team.id);
    if (exists) {
      if (teamId) {
        // Multiple teams with SSO found
        return { teamId: '', useSlug: true };
      }
      teamId = team.id;
    }
  }

  return {
    teamId,
    useSlug: false,
  };
}
