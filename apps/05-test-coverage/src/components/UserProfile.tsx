import React from 'react';
import { User } from '../types/Task';

interface UserProfileProps {
  user?: User;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const defaultUser: User = {
    id: '1',
    name: 'Test User',
    email: 'testuser@example.com',
    role: 'admin'
  };

  const currentUser = user || defaultUser;

  return (
    <div className="user-profile">
      <h3>User Profile</h3>
      <div className="profile-avatar">
        {currentUser.avatar ? (
          <img src={currentUser.avatar} alt={currentUser.name} />
        ) : (
          <div className="avatar-placeholder">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="profile-info">
        <p className="profile-name">{currentUser.name}</p>
        <p className="profile-email">{currentUser.email}</p>
        <p className="profile-role">Role: {currentUser.role}</p>
        {currentUser.preferences && (
          <div className="profile-preferences">
            <p>Theme: {currentUser.preferences.theme}</p>
            <p>Notifications: {currentUser.preferences.notifications ? 'On' : 'Off'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
