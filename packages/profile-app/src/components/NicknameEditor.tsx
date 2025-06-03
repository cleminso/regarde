import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { checkNicknameAvailability, updateUserNickname } from '../lib/api';

interface NicknameEditorProps {
  accountId?: string;
  currentNickname?: string;
}

const NicknameEditor: React.FC<NicknameEditorProps> = ({
  accountId,
  currentNickname,
}) => {
  const [nickname, setNickname] = useState(currentNickname || '');
  const [buttonState, setButtonState] = useState<
    'View' | 'Update' | 'N/A' | 'Checking...' | 'Error'
  >('View');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize nickname and button state when props change
    setNickname(currentNickname || '');
    if (currentNickname) {
      setButtonState('View');
    } else {
      // If no current nickname, and user is logged in, prompt for check
      setButtonState('Checking...'); // Or some other initial state if accountId is present
      if (
        accountId &&
        (currentNickname === undefined || currentNickname === '')
      ) {
        handleNicknameChange(currentNickname || ''); // Trigger initial check or an empty state
      }
    }
  }, [currentNickname, accountId]);

  const handleNicknameChange = useCallback(
    async (newNickname: string) => {
      setNickname(newNickname);
      setError(null);

      if (!accountId) {
        setButtonState('View'); // Or some disabled state
        return;
      }

      if (newNickname === currentNickname) {
        setButtonState('View');
        return;
      }

      if (newNickname === '') {
        setButtonState('N/A'); // Cannot register empty nickname
        setError('Nickname cannot be empty.');
        return;
      }

      setIsLoading(true);
      setButtonState('Checking...');
      try {
        // Now using the imported API function
        const { available } = await checkNicknameAvailability(newNickname);
        if (available) {
          setButtonState('Update');
        } else {
          setButtonState('N/A');
          // API might provide a more specific message in err.message or a takenBy field
          setError('Nickname not available.');
        }
      } catch (err: any) {
        console.error('Error checking nickname availability:', err);
        setButtonState('Error');
        setError(err.message || 'Could not check availability.');
      } finally {
        setIsLoading(false);
      }
    },
    [currentNickname, accountId],
  );

  const handleButtonClick = async () => {
    setError(null);
    if (!accountId) {
      navigate('/');
      return;
    }

    if (buttonState === 'View') {
      if (nickname) {
        navigate(`/@${nickname}`);
      }
    } else if (buttonState === 'Update') {
      setIsLoading(true);
      try {
        // Now using the imported API function
        const success = await updateUserNickname(
          accountId,
          nickname,
          currentNickname,
        );
        if (success) {
          // Optionally, update currentNickname state here if the parent component relies on it
          // Or expect parent to refetch/update based on navigation or other signals
          navigate(`/@${nickname}`);
        } else {
          // This path might not be hit if updateUserNickname throws an error for non-success cases
          setError('Failed to update nickname.');
          setButtonState('Error');
        }
      } catch (err: any) {
        console.error('Error registering nickname:', err);
        setError(err.message || 'Failed to update nickname.');
        setButtonState('Error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!accountId) {
    // Optionally, render something different or nothing if the user is not logged in
    // For now, let's assume it's part of a page that only shows for logged-in users
    // Or, it could show a prompt to log in/sign up
    return <p>Please log in to manage your nickname.</p>;
  }

  // Base button classes
  const baseButtonClasses =
    'px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';

  // State-specific button classes
  let buttonSpecificClasses = '';
  if (buttonState === 'N/A' || buttonState === 'Error') {
    buttonSpecificClasses =
      'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
  } else if (buttonState === 'View') {
    buttonSpecificClasses =
      'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
  } else if (buttonState === 'Update') {
    buttonSpecificClasses =
      'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500';
  } else if (buttonState === 'Checking...' || isLoading) {
    buttonSpecificClasses = 'bg-gray-400 text-gray-800 cursor-wait'; // Using cursor-wait for checking
  }

  // Disabled state overrides others if it's purely a disabled state not covered by checking/N/A/Error
  const isDisabled =
    isLoading ||
    buttonState === 'N/A' ||
    buttonState === 'Checking...' ||
    buttonState === 'Error' ||
    !accountId;
  if (
    isDisabled &&
    !(
      buttonState === 'Checking...' ||
      isLoading ||
      buttonState === 'N/A' ||
      buttonState === 'Error'
    )
  ) {
    // General disabled state if not already styled by N/A, Error, Checking
    buttonSpecificClasses = 'bg-gray-300 text-gray-500 cursor-not-allowed';
  }

  return (
    <div className="my-4 p-4 border border-gray-200 rounded-md dark:border-gray-700">
      <label
        htmlFor="nicknameInput"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Nickname
      </label>
      <div className="flex items-center space-x-2">
        <input
          id="nicknameInput"
          type="text"
          value={nickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          placeholder="Enter desired nickname"
          disabled={isLoading || !accountId}
          className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-700 dark:focus:ring-offset-gray-800"
        />
        <button
          onClick={handleButtonClick}
          disabled={isDisabled}
          className={`${baseButtonClasses} ${buttonSpecificClasses}`}
        >
          {isLoading ? 'Loading...' : buttonState}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default NicknameEditor;
