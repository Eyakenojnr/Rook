const RookIcon = ({ className = 'w-6 h-6', ...props }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {/* Top Crenellations/Battlements (Symmetrical 3-merlon crown) */}
            <path d="M4 4h4v3h2V4h4v3h2V4h4v5H4V4z" />

            {/* Tapered Tower Waist */}
            <path d="M6 9l1 8h10l1-8" />

            {/* Heavy Plinth / Base */}
            <path d="M4 17h16v3H4z" />

            {/* Foundation Pedestal Line */}
            <path d="M3 20h18" />
        </svg>
    );
};

export default RookIcon;