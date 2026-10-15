import { useState } from "react";
import TaskGrid from "../features/learning/TaskGrid";
import TaskFilters from "../features/learning/TaskFilters";
import BackButton from "../components/common/BackButton";

const Learning = () => {

    const [search, setSearch] = useState("");
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("");

    return (
        <div className="learning-page">

            {/* Page Header */}
            <main>
  <BackButton fallback="/learning" />
  {/* Existing learning page content */}
</main>
            <div className="learning-header">
                <h1>Learn Programming</h1>

                <p>
                    Practice programming problems and improve your skills
                    with AI-assisted learning.
                </p>
            </div>

            {/* Programming Tasks */}
            <div className="learning-content">

                <h2>Programming Tasks</h2>

                <TaskFilters
                    search={search}
                    setSearch={setSearch}
                    topic={topic}
                    setTopic={setTopic}
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                />

                <TaskGrid
                    search={search}
                    topic={topic}
                    difficulty={difficulty}
                />

            </div>

        </div>
    );
};

export default Learning;