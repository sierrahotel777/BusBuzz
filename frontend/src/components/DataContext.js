import React, { createContext, useState, useContext } from 'react';
import { initialFeedbackData, initialAnnouncements, initialCommendations, initialLostAndFound, initialCrowdednessData } from '../mockData';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [feedbackData, setFeedbackData] = useState(initialFeedbackData);
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [commendations, setCommendations] = useState(initialCommendations);
    const [lostAndFoundItems, setLostAndFoundItems] = useState(initialLostAndFound);
    const [crowdednessData, setCrowdednessData] = useState(initialCrowdednessData);

    const value = {
        feedbackData,
        setFeedbackData,
        announcements,
        setAnnouncements,
        commendations,
        setCommendations,
        lostAndFoundItems,
        setLostAndFoundItems,
        crowdednessData,
        setCrowdednessData,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};