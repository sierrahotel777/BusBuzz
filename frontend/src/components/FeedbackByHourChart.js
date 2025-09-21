import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTheme } from './ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function FeedbackByHourChart({ feedbackData }) {
    const { theme } = useTheme();

    const chartData = useMemo(() => {
        const countsByHour = Array(24).fill(0);
        feedbackData.forEach(fb => {
            const hour = new Date(fb.submittedOn).getHours();
            countsByHour[hour]++;
        });

        const labels = Array.from({ length: 24 }, (_, i) => {
            if (i === 0) return '12 AM';
            if (i < 12) return `${i} AM`;
            if (i === 12) return '12 PM';
            return `${i - 12} PM`;
        });

        return {
            labels,
            datasets: [{
                label: 'Number of Feedback Submissions',
                data: countsByHour,
                backgroundColor: theme === 'dark' ? 'rgba(0, 123, 255, 0.6)' : 'rgba(0, 90, 156, 0.6)',
                borderColor: theme === 'dark' ? '#007bff' : '#005A9C',
                borderWidth: 1,
            }]
        };
    }, [feedbackData, theme]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: theme === 'dark' ? '#c9d1d9' : '#6c757d',
                    stepSize: 1
                },
                grid: {
                    color: theme === 'dark' ? '#30363d' : '#dee2e6',
                }
            },
            x: {
                ticks: {
                    color: theme === 'dark' ? '#c9d1d9' : '#6c757d',
                },
                grid: {
                    display: false,
                }
            }
        },
        plugins: {
            legend: {
                display: false,
            }
        }
    };

    return <Bar data={chartData} options={options} />;
}

export default FeedbackByHourChart;