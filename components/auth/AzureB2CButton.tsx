import { signIn } from 'next-auth/react';
import { Button } from 'react-daisyui';
import { useTranslation } from 'next-i18next';
import useInvitation from 'hooks/useInvitation';
import env from '@/lib/env';

const AzureB2CButton = () => {
  const { t } = useTranslation('common');
  const { invitation } = useInvitation();

  const callbackUrl = invitation
    ? `/invitations/${invitation.token}`
    : env.redirectIfAuthenticated;

  return (
    <Button
      className="btn btn-outline w-full"
      onClick={() => {
        signIn("azure-ad-b2c", { callbackUrl })
      }}
      size="md"
    >
      {t('continue-with-azureB2C')}
    </Button>
  );
};

export default AzureB2CButton;
