
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { View, TeamMember } from '../types.ts';
import { hasPermission } from '../utils/permissions.ts';

type GuideStep = {
  elementId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  permissions?: ('admin' | 'scheduler')[];
};

const VIEW_GUIDES: Record<View, GuideStep[]> = {
    'my-schedule': [
        { elementId: 'guide-daily-engagement', title: "Today's Focus", content: "Check here daily for AI-generated prayer points and a reflection question to keep the team aligned and spiritually focused.", position: 'bottom' },
        { elementId: 'guide-announcements', title: "Team Announcements", content: "Admins will post important updates here. They'll disappear once you've seen them.", position: 'bottom' },
        { elementId: 'guide-my-assignments', title: "Your Schedule", content: "All your upcoming assignments appear here. You can check in for events, review attire, and submit debriefs after the service.", position: 'top' },
    ],
    'full-schedule': [
        { elementId: 'full-schedule-title', title: "Full Team Schedule", content: "This is the master schedule for all events. Schedulers and admins can manage assignments from here.", position: 'bottom' },
        { elementId: 'guide-event-card', title: "Event Card", content: "Each card shows an event's date, time, and assigned roles. Click 'Assign' to schedule a team member.", position: 'bottom', permissions: ['scheduler'] },
        { elementId: 'guide-ai-assistant-btn', title: "AI Scheduling Assistant", content: "Need help scheduling? Click here to have our AI suggest a full roster based on skills and availability.", position: 'left', permissions: ['scheduler'] },
    ],
    'team': [
        { elementId: 'guide-invite-members-btn', title: "Invite Members", content: "Click here to get shareable links to invite new members or administrators to your team.", position: 'bottom', permissions: ['admin'] },
        { elementId: 'guide-pending-members', title: "Pending Members", content: "When new members use your invite link, they will appear here for you to approve or deny.", position: 'bottom', permissions: ['admin'] },
        { elementId: 'guide-management-actions', title: "Management Actions", content: "Define the roles, skills, and achievements that are specific to your team.", position: 'bottom', permissions: ['admin'] },
        { elementId: 'guide-member-card', title: "Member Card", content: "See each member's skills and attendance stats at a glance. Click the card to view their full profile.", position: 'top' },
    ],
    'reports': [
        { elementId: 'guide-debrief-analysis', title: "AI Debrief Analysis", content: "Click the 'Analyze' button to have AI read through all submitted debriefs and identify recurring themes, strengths, and areas for growth for the whole team.", position: 'bottom' },
        { elementId: 'guide-timeliness-chart', title: "Check-in Timeliness", content: "This chart shows a team-wide summary of how often members check in early, on-time, or late for their call times.", position: 'top' },
    ],
    'review': [
        { elementId: 'guide-ai-review-form', title: "AI Service Review", content: "Paste a YouTube link to a past service. Our AI will analyze it from a broadcast perspective and provide detailed, constructive feedback.", position: 'bottom' },
        { elementId: 'guide-analysis-history', title: "Analysis History", content: "All past analyses are saved here. You can click 'Re-analyze' to run a new report on an old link.", position: 'top' },
        { elementId: 'guide-improvement-trends', title: "Improvement Trends", content: "After you have at least two analyses, you can generate a trend report to see how the team is improving over time.", position: 'top', permissions: ['scheduler'] },
    ],
    'profile': [
        { elementId: 'guide-profile-header', title: 'Your Profile', content: "This is your personal space. Edit your info, share fun facts, and track your progress.", position: 'bottom' },
        { elementId: 'guide-personal-goals', title: 'Personal Goals', content: "Set and track your own goals for serving on the team. This is private to you.", position: 'top' },
        { elementId: 'guide-strengths-growth', title: 'Strengths & Growth', content: "Identify your strengths and areas you want to grow in. Leadership may also add suggestions here.", position: 'top' },
        { elementId: 'guide-growth-plan', title: 'Personalized Growth Plan', content: "Once you select areas for growth, you can generate an AI-powered plan with links to helpful resources.", position: 'top' },
        { elementId: 'guide-availability-calendar', title: 'Availability', content: "Click dates to mark when you're unavailable. This helps schedulers plan accordingly.", position: 'top' },
    ],
    'training': [
        { elementId: 'guide-training-scenarios', title: "Practice Scenarios", content: "Select a skill and get an AI-generated, interactive scenario to test your knowledge in a safe environment.", position: 'bottom' },
        { elementId: 'guide-add-training-video-btn', title: "Add Training Videos", content: "Admins can build a training library for the team by uploading custom videos or adding links to YouTube tutorials.", position: 'left', permissions: ['admin'] },
        { elementId: 'guide-training-library', title: "Training Library", content: "Find all team training videos here, now organized by month and subject for easy browsing.", position: 'top' },
    ],
    'encouragement': [
        { elementId: 'guide-weekly-skill-focus', title: "Weekly Encouragement", content: "Generate a new AI-powered encouragement video and script each week to focus on a practical skill.", position: 'bottom' },
        { elementId: 'guide-shout-out-btn', title: "Team Shout-Outs", content: "See what encouraging things your teammates are saying about each other. Use the '+' button to give your own!", position: 'top' },
    ],
    'faq': [
        { elementId: 'guide-add-faq-btn', title: "Add FAQs", content: "Admins can add new questions and answers to the FAQ list for the whole team.", position: 'bottom', permissions: ['admin'] },
        { elementId: 'guide-suggested-faqs', title: "Suggested FAQs", content: "Quickly add common questions to your FAQ list with pre-written answers you can customize.", position: 'top', permissions: ['admin'] },
        { elementId: 'guide-faq-list', title: "FAQ List", content: "All team members can view the FAQ list to find answers to common questions about serving.", position: 'top' },
    ],
    'children': [
        { elementId: 'guide-register-child-btn', title: "Register New Child", content: "Add a child to the database with guardian contact info and medical notes.", position: 'left' },
        { elementId: 'guide-child-search', title: "Check-in Dashboard", content: "Search for children by name or guardian. Use the buttons on each card to check them in or out.", position: 'bottom' },
    ],
    'inventory': [
        { elementId: 'guide-add-item-btn', title: "Add Inventory", content: "Admins can track new equipment by adding it here.", position: 'left', permissions: ['admin'] },
        { elementId: 'guide-inventory-list', title: "Inventory List", content: "View all items, track status (Available, In Use, Maintenance), check items in/out, and see who has what.", position: 'top' },
    ],
};

interface InteractiveGuideProps {
  view: View;
  currentUser: TeamMember;
  onClose: () => void;
}

export const InteractiveGuide: React.FC<InteractiveGuideProps> = ({ view, currentUser, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const guideSteps = useMemo(() => {
    return (VIEW_GUIDES[view] || []).filter(step => 
      !step.permissions || step.permissions.some(p => hasPermission(currentUser, p))
    );
  }, [view, currentUser]);
  
  const currentStep = guideSteps[stepIndex];

  // Function to update the highlight rectangle position
  const updateRect = useCallback(() => {
      if (currentStep) {
          const element = document.getElementById(currentStep.elementId);
          if (element) {
              setRect(element.getBoundingClientRect());
          }
      }
  }, [currentStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStepIndex(prev => Math.min(prev + 1, guideSteps.length - 1));
      if (e.key === 'ArrowLeft') setStepIndex(prev => Math.max(prev - 1, 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true); // Capture scroll

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect, true);
    };
  }, [onClose, guideSteps.length, updateRect]);

  useEffect(() => {
    if (!currentStep) {
      onClose();
      return;
    }
    const targetElement = document.getElementById(currentStep.elementId);
    if (!targetElement) {
        // If element is missing (e.g. filtered out), auto-skip
        if (stepIndex < guideSteps.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            onClose();
        }
        return;
    }
    
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    // Delay rect calculation slightly to allow for smooth scroll
    setTimeout(() => {
        setRect(targetElement.getBoundingClientRect());
    }, 400);

  }, [stepIndex, guideSteps, currentStep, onClose]);

  if (!currentStep || !rect) {
    return null;
  }
  
  const getTooltipPosition = () => {
    const tooltipStyle: React.CSSProperties = {
        position: 'absolute',
        width: '280px', // Slightly wider for mobile
        zIndex: 1002,
    };
    
    const margin = 15;

    switch (currentStep.position) {
        case 'bottom':
            tooltipStyle.top = `${rect.bottom + margin}px`;
            tooltipStyle.left = `${rect.left + rect.width / 2 - 140}px`;
            break;
        case 'top':
            tooltipStyle.bottom = `${window.innerHeight - rect.top + margin}px`;
            tooltipStyle.left = `${rect.left + rect.width / 2 - 140}px`;
            break;
        case 'right':
            tooltipStyle.top = `${rect.top}px`;
            tooltipStyle.left = `${rect.right + margin}px`;
            break;
        case 'left':
            tooltipStyle.top = `${rect.top}px`;
            tooltipStyle.right = `${window.innerWidth - rect.left + margin}px`;
            break;
    }

    // Force tooltip to stay within viewport
    const leftVal = parseInt(String(tooltipStyle.left || 0));
    if (tooltipStyle.left && leftVal < 10) tooltipStyle.left = '10px';
    if (tooltipStyle.left && leftVal + 280 > window.innerWidth - 10) {
        tooltipStyle.left = undefined;
        tooltipStyle.right = '10px';
    }
    
    // Handle vertical overflow (simple flip check could go here, but sticking to basics)
    if (parseInt(String(tooltipStyle.top)) < 10) tooltipStyle.top = '10px';

    return tooltipStyle;
  }


  return (
    <div className="fixed inset-0 z-[1000]">
      {/* The Highlight Box with Cutout Effect using Shadow */}
      <div 
        className="absolute transition-all duration-300 ease-out pointer-events-none"
        style={{
            top: `${rect.top - 5}px`,
            left: `${rect.left - 5}px`,
            width: `${rect.width + 10}px`,
            height: `${rect.height + 10}px`,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)', // Darkens everything else
            borderRadius: '8px',
            zIndex: 1001,
        }}
      />
      
      <div style={getTooltipPosition()} className="animate-fade-in">
         <div className="bg-white rounded-lg shadow-xl p-5 border border-gray-200 relative">
             <button 
                onClick={onClose} 
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                title="Close Guide"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
             </button>
             
             <h3 className="font-bold text-lg text-gray-800 pr-6">{currentStep.title}</h3>
             <p className="text-sm text-gray-600 mt-2 leading-relaxed">{currentStep.content}</p>
             
             <div className="mt-5 flex justify-between items-center">
                 <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Step {stepIndex + 1} of {guideSteps.length}</span>
                 <div className="flex gap-2">
                     {stepIndex > 0 && (
                        <button 
                            onClick={() => setStepIndex(stepIndex - 1)} 
                            className="text-sm font-medium text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                        >
                            Back
                        </button>
                     )}
                     {stepIndex < guideSteps.length - 1 ? (
                         <button 
                            onClick={() => setStepIndex(stepIndex + 1)} 
                            className="text-sm font-semibold text-white bg-brand-primary px-4 py-1.5 rounded shadow-sm hover:bg-brand-primary-dark transition-colors"
                        >
                            Next
                        </button>
                     ) : (
                         <button 
                            onClick={onClose} 
                            className="text-sm font-semibold text-white bg-brand-primary px-4 py-1.5 rounded shadow-sm hover:bg-brand-primary-dark transition-colors"
                        >
                            Finish
                        </button>
                     )}
                 </div>
             </div>
         </div>
         {/* Tooltip Arrow (Optional, simplified for dynamic positioning) */}
      </div>
    </div>
  );
};
