import {
  Cog6ToothIcon,
  UserGroupIcon,
  KeyIcon,
  CloudIcon,
  BellIcon,
  BanknotesIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import type { Team } from '@prisma/client';
import classNames from 'classnames';
import useCanAccess from 'hooks/useCanAccess';
import Link from 'next/link';
import { TeamFeature } from 'types';
import { Resource } from 'lib/permissions';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'next-i18next';

interface TeamTabProps {
  activeTab: string;
  team: Team;
  heading?: string;
  teamFeatures: TeamFeature;
}

const TeamTab = ({ activeTab, team, heading, teamFeatures }: TeamTabProps) => {
  const { canAccess } = useCanAccess();
  const { t } = useTranslation('common');

  const navigations = [
    {
      name: t('settings'),
      href: `/teams/${team.slug}/settings`,
      active: activeTab === 'settings',
      icon: Cog6ToothIcon,
    },
  ];

  if (canAccess('team_member' as unknown as Resource, ['create', 'update', 'read', 'delete'])) {
    navigations.push({
      name: t('members'),
      href: `/teams/${team.slug}/members`,
      active: activeTab === 'members',
      icon: UserGroupIcon,
    });
  }

  if (
    teamFeatures.sso &&
    canAccess('team_sso' as unknown as Resource, ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: t('Single Sign-On'),
      href: `/teams/${team.slug}/sso`,
      active: activeTab === 'sso',
      icon: KeyIcon,
    });
  }

  if (
    teamFeatures.dsync &&
    canAccess('team_dsync' as unknown as Resource, ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: t('Directory Sync'),
      href: `/teams/${team.slug}/directory-sync`,
      active: activeTab === 'directory-sync',
      icon: CloudIcon,
    });
  }

  if (
    teamFeatures.auditLog &&
    canAccess('team_audit_log' as unknown as Resource, ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: t('Audit Logs'),
      href: `/teams/${team.slug}/audit-logs`,
      active: activeTab === 'audit-logs',
      icon: BellIcon,
    });
  }

  if (
    teamFeatures.payments &&
    canAccess('team_payments' as unknown as Resource, ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: t('Billing'),
      href: `/teams/${team.slug}/billing`,
      active: activeTab === 'payments',
      icon: BanknotesIcon,
    });
  }

  if (
    teamFeatures.webhook &&
    canAccess('team_webhook' as unknown as Resource, ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: t('Webhooks'),
      href: `/teams/${team.slug}/webhooks`,
      active: activeTab === 'webhooks',
      icon: PaperAirplaneIcon,
    });
  }

  if (
    teamFeatures.apiKey &&
    canAccess('team_api_key' as unknown as Resource, ['create', 'update', 'read', 'delete'])
  ) {
    navigations.push({
      name: t('API Keys'),
      href: `/teams/${team.slug}/api-keys`,
      active: activeTab === 'api-keys',
      icon: KeyIcon,
    });
  }

  if (
    'chat' in teamFeatures && 
    teamFeatures.chat
  ) {
    navigations.push({
      name: t('Chat'),
      href: `/teams/${team.slug}/chat`,
      active: activeTab === 'chat',
      icon: MessageSquare,
    });
  }

  return (
    <div className="flex flex-col pb-6">
      <h2 className="text-xl font-semibold mb-2">
        {heading || team.name}
      </h2>
      <nav
        className="flex flex-wrap border-b border-gray-300"
        aria-label="Tabs"
      >
        {navigations.map((menu) => (
          <Link
            href={menu.href}
            key={menu.href}
            className={classNames(
              'inline-flex items-center border-b-2 py-2 md:py-4 mr-5 text-sm font-medium',
              menu.active
                ? 'border-gray-900 text-gray-700 dark:text-gray-100'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:dark:text-gray-100'
            )}
          >
            <menu.icon className="w-4 h-4 mr-2" />
            {menu.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default TeamTab;
