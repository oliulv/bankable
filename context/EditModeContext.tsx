import React, { createContext, useContext, useState } from 'react';

type EditModeContextType = {
  editMode: boolean;
  toggleEditMode: () => void;
};

const EditModeContext = createContext<EditModeContextType>({
  editMode: false,
  toggleEditMode: () => {},
});

export const EditModeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [editMode, setEditMode] = useState(false);
  
  const toggleEditMode = () => {
    setEditMode(prev => !prev);
  };
  
  return (
    <EditModeContext.Provider value={{ editMode, toggleEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => useContext(EditModeContext);