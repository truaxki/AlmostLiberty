const { getAIResponse } = require('./geminiStream');

const handleSearch = async (req, res) => {
    const { message } = req.body;

    console.log('Received search message:', message);

    try {
        const { responseText, duration } = await getAIResponse(message);

        res.json({ reply: responseText, duration });
    } catch (error) {
        console.error("Error in handleSearch:", error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

module.exports = {
    handleSearch
};
