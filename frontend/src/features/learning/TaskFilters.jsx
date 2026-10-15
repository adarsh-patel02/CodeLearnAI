const TaskFilters = ({
    search,
    setSearch,
    topic,
    setTopic,
    difficulty,
    setDifficulty
}) => {

    return (
        <div className="task-filters">

            {/* Search */}
            <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* Topic */}
            <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
            >
                <option value="">All Topics</option>
                <option value="basics">Programming Basics</option>
                <option value="arrays">Arrays</option>
                <option value="strings">Strings</option>
                <option value="loops">Loops</option>
            </select>

            {/* Difficulty */}
            <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
            >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
            </select>

        </div>
    );
};

export default TaskFilters;