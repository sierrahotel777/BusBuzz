import { routeData } from '../components/routeData';
export const getAiResponse = (query) => {
  const lowerCaseQuery = query.toLowerCase().trim();

  if (lowerCaseQuery.includes("hi") || lowerCaseQuery.includes("hello")) {
    return {
      text: "Hello and welcome to the AI Chatbot! How can I help you with bus details today? You can ask about routes or select an option below.",
      options: Object.keys(routeData).map(routeId => ({
        label: routeId,
        value: { type: 'select_route', routeId }
      }))
    };
  }

  if (lowerCaseQuery.includes("thank")) {
    return "You're welcome! Let me know if you need anything else.";
  }

  if (lowerCaseQuery.includes("bus") || lowerCaseQuery.includes("route") || lowerCaseQuery.includes("timing") || lowerCaseQuery.includes("detail")) {
    return {
      text: 'Of course! Please select a bus route to see its stops and timings.',
      options: Object.keys(routeData).map(routeId => ({
        label: routeId,
        value: { type: 'select_route', routeId }
      }))
    };
  }

  return "I'm sorry, I can only provide information about bus routes and details. Please ask me about the bus schedule.";
};