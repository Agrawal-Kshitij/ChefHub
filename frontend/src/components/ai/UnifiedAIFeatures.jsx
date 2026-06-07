import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiEndpoint } from '../../utils/apiConfig';
import { useThemeAwareStyle } from '../../utils/themeUtils';
import { useAuth } from '../../context/AuthContext';

// AI Component: Personalized Chef Recommendations
const AIChefRecommendations = ({ onGetRecommendations }) => {
	const { classes, isDark } = useThemeAwareStyle();
	const { token } = useAuth();
	const [loading, setLoading] = useState(true);
	const [recommendations, setRecommendations] = useState(null);

	// Auto-fetch recommendations on mount
	useEffect(() => {
		if (token) {
			getRecommendations();
		}
	}, [token]);

	const getRecommendations = async () => {
		setLoading(true);
		try {
			// No preferences needed - backend uses user profile
			const response = await axios.post(
				buildApiEndpoint('ai/chef-recommendations'),
				{},
				{
					headers: { Authorization: `Bearer ${token}` }
				}
			);
			const recs = response.data.data;

			setRecommendations(recs);
			if (onGetRecommendations) onGetRecommendations(recs);
		} catch (error) {
			console.error('Error fetching recommendations:', error);
			setRecommendations({ error: 'Failed to get recommendations' });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`${classes.bg.card} rounded-lg shadow-lg p-6 border ${classes.border.default} mb-6`}>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className={`text-xl font-bold ${classes.text.heading}`}>
						🧑‍🍳 Curated For You
					</h3>
					<p className={`text-sm ${classes.text.secondary}`}>
						Chefs matched to your taste profile
					</p>
				</div>
				<button
					onClick={getRecommendations}
					disabled={loading}
					className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
				>
					{loading ? 'Refreshing...' : 'Refresh Matches'}
				</button>
			</div>

			{loading && (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
					<span className={`ml-2 ${classes.text.secondary}`}>Analyzing chef profiles...</span>
				</div>
			)}

			{recommendations && !recommendations.error && recommendations.length > 0 && (
				<div className="space-y-4 mt-4">
					{recommendations.map((chef, index) => (
						<div key={index} className={`p-4 rounded-lg border ${classes.border.default} ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
							<div className="flex justify-between items-start">
								<div>
									<h4 className={`font-bold ${classes.text.heading}`}>{chef.name}</h4>
									<p className={`text-sm ${classes.text.primary}`}>{chef.matchReason}</p>
									<div className="mt-2 text-xs flex flex-wrap gap-2">
										<span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
											{chef.confidenceScore}% Match
										</span>
										<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
											{chef.specialty}
										</span>
									</div>
								</div>
								<div className="text-right">
									<p className={`font-bold ${classes.text.heading}`}>₹{chef.pricePerHour}/hr</p>
									<p className={`text-xs ${classes.text.muted}`}>{chef.experienceYears} years exp</p>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{recommendations && !recommendations.error && recommendations.length === 0 && (
				<div className={`p-6 mt-4 rounded-lg text-center border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
					<div className="text-4xl mb-2">🍽️</div>
					<h4 className={`text-lg font-medium mb-1 ${classes.text.heading}`}>No matching chefs found</h4>
					<p className={`text-sm ${classes.text.secondary} mb-3`}>
						We checked our chef network but couldn't find a perfect match right now.
					</p>

				</div>
			)}

			{recommendations?.error && (
				<div className="p-4 bg-red-100 text-red-700 rounded-lg">
					{recommendations.error}
				</div>
			)}
		</div>
	);
};

// AI Component: Menu Generator
const AIMenuGenerator = ({ eventDetails, onMenuGenerated }) => {
	const { classes, isDark } = useThemeAwareStyle();
	const [loading, setLoading] = useState(false);
	const [menu, setMenu] = useState(null);

	const generateMenu = async () => {
		setLoading(true);

		// Validate essential fields
		if (!eventDetails.cuisine && !eventDetails.serviceType) {
			setMenu({
				error: 'Please select at least a cuisine type or service type to generate a personalized menu.',
				validation: true
			});
			setLoading(false);
			return;
		}

		try {

			const response = await axios.post(buildApiEndpoint('ai/generate-menu'), {
				eventDetails
			});

			const responseData = response.data.data;
			setMenu(responseData);
			onMenuGenerated(responseData);
		} catch (error) {
			let errorMessage = 'Sorry, I could not generate a menu right now.';
			if (error.response?.status === 404) {
				errorMessage = 'AI service is currently unavailable. Please make sure the backend server is running.';
			} else if (error.response?.status === 500) {
				errorMessage = 'AI service error. Please check if the Gemini API key is configured.';
			} else if (error.code === 'ECONNREFUSED') {
				errorMessage = 'Cannot connect to server. Please make sure the backend is running on localhost:5000 or render.com';
			}

			setMenu({
				error: errorMessage,
				rawResponse: error.response?.data?.error || error.message
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`${classes.bg.card} rounded-lg shadow-lg p-6 border ${classes.border.default}`}>
			<div className="flex items-center justify-between mb-4">
				<h3 className={`text-xl font-bold ${classes.text.heading}`}>
					AI Menu Generator
				</h3>
				<button
					onClick={generateMenu}
					disabled={loading}
					className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
				>
					{loading ? 'Creating Menu...' : 'Generate Menu'}
				</button>
			</div>

			{loading && (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
					<span className={`ml-2 ${classes.text.secondary}`}>Creating personalized menu...</span>
				</div>
			)}

			{menu && (
				<div className="space-y-6">
					{menu.error ? (
						<div className={`border rounded-lg p-4 ${isDark ? 'border-amber-800/30 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
							<p className={`${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
								{'Warning: '}{menu.error}
							</p>
							{menu.rawResponse && (
								<details className="mt-2">
									<summary className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'} cursor-pointer`}>Show error details</summary>
									<pre className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'} mt-2 whitespace-pre-wrap`}>
										{menu.rawResponse}
									</pre>
								</details>
							)}
						</div>
					) : (
						<>
							<div>
								<h4 className={`font-semibold text-lg mb-2 ${classes.text.heading}`}>🥗 Appetizers</h4>
								<ul className="list-disc list-inside space-y-1">
									{menu.appetizers?.map((item, index) => (
										<li key={index} className={classes.text.primary}>{item}</li>
									)) || <li className={classes.text.muted}>No appetizers available</li>}
								</ul>
							</div>

							<div>
								<h4 className={`font-semibold text-lg mb-2 ${classes.text.heading}`}>Main Course</h4>
								<ul className="list-disc list-inside space-y-1">
									{menu.mainCourse?.map((item, index) => (
										<li key={index} className={classes.text.primary}>{item}</li>
									)) || <li className={classes.text.muted}>No main course available</li>}
								</ul>
							</div>

							<div>
								<h4 className={`font-semibold text-lg mb-2 ${classes.text.heading}`}>Desserts</h4>
								<ul className="list-disc list-inside space-y-1">
									{menu.desserts?.map((item, index) => (
										<li key={index} className={classes.text.primary}>{item}</li>
									)) || <li className={classes.text.muted}>No desserts available</li>}
								</ul>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
};

// AI Component: Chat Assistant
const AIChatAssistant = () => {
	const { classes, isDark } = useThemeAwareStyle();
	const { user } = useAuth();
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);

	const sendMessage = async (e) => {
		e.preventDefault();
		if (!input.trim()) return;

		const userMessage = { type: 'user', content: input, timestamp: new Date() };
		setMessages(prev => [...prev, userMessage]);
		setInput('');
		setLoading(true);

		try {
			const response = await axios.post(buildApiEndpoint('ai/chat'), {
				message: input,
				context: messages.slice(-5).map(m => `${m.type}: ${m.content}`).join('\n')
			});

			const aiMessage = {
				type: 'ai',
				content: response.data.data.response,
				timestamp: new Date()
			};
			setMessages(prev => [...prev, aiMessage]);
		} catch (error) {

			let errorText = 'Sorry, I encountered an error. Please try again.';
			if (error.response?.status === 404) {
				errorText = 'AI service is currently unavailable. Please make sure the backend server is running.';
			} else if (error.response?.status === 500) {
				errorText = 'AI service error. Please check if the Gemini API key is configured.';
			} else if (error.code === 'ECONNREFUSED') {
				errorText = 'Cannot connect to server. Please make sure the backend is running on localhost:5000 or render.com';
			}

			const errorMessage = {
				type: 'ai',
				content: errorText,
				timestamp: new Date()
			};
			setMessages(prev => [...prev, errorMessage]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`${classes.bg.card} rounded-lg shadow-lg border ${classes.border.default} flex flex-col h-[600px]`}>
			{/* Header */}
			<div className={`p-6 border-b ${classes.border.default} ${isDark ? 'bg-gradient-to-r from-amber-900/20 to-orange-900/20' : 'bg-gradient-to-r from-amber-50 to-orange-50'}`}>
				<div className="flex items-center space-x-3">
					<div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white text-2xl shadow-lg">

					</div>
					<div>
						<h3 className={`text-xl font-bold ${classes.text.heading}`}>
							AI Chef Assistant
						</h3>
						<p className={`text-sm ${classes.text.muted}`}>
							Ask me anything about cooking & recipes
						</p>
					</div>
				</div>
			</div>

			{/* Messages Area */}
			<div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDark ? 'bg-gray-900/50' : 'bg-stone-50/50'}`}>
				{messages.length === 0 && (
					<div className="flex flex-col items-center justify-center h-full">
						<div className="text-6xl mb-4"></div>
						<p className={`${classes.text.muted} text-center max-w-md`}>
							Welcome! I'm your AI culinary assistant. Ask me about cooking techniques, recipes, ingredient substitutions, or food preparation tips!
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-md">
							<button
								onClick={() => setInput("What's a good recipe for pasta?")}
								className={`text-left p-3 rounded-lg border ${classes.border.default} ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-stone-50'} transition-colors text-sm ${classes.text.secondary}`}
							>
								Recipe suggestions
							</button>
							<button
								onClick={() => setInput("How do I cook perfect rice?")}
								className={`text-left p-3 rounded-lg border ${classes.border.default} ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-stone-50'} transition-colors text-sm ${classes.text.secondary}`}
							>
								Cooking techniques
							</button>
							<button
								onClick={() => setInput("Can you suggest meal prep ideas?")}
								className={`text-left p-3 rounded-lg border ${classes.border.default} ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-stone-50'} transition-colors text-sm ${classes.text.secondary}`}
							>
								Meal planning
							</button>
							<button
								onClick={() => setInput("What are healthy alternatives to sugar?")}
								className={`text-left p-3 rounded-lg border ${classes.border.default} ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-stone-50'} transition-colors text-sm ${classes.text.secondary}`}
							>
								Healthy swaps
							</button>
						</div>
					</div>
				)}

				{messages.map((message, index) => (
					<div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
						<div className={`flex items-start max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
							{/* Avatar */}
							<div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
								{message.type === 'user' ? (
									user?.profileImage ? (
										<img
											src={user.profileImage}
											alt={user.name || 'User'}
											className="w-8 h-8 rounded-full object-cover shadow-md border-2 border-blue-400"
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md text-sm font-bold">
											{user?.name?.charAt(0).toUpperCase() || 'U'}
										</div>
									)
								) : (
									<div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
										🤖
									</div>
								)}
							</div>

							{/* Message Bubble */}
							<div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
								<div className={`rounded-2xl px-4 py-3 shadow-md ${message.type === 'user'
									? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-none'
									: isDark
										? 'bg-gray-800 border border-gray-700 rounded-tl-none'
										: 'bg-white border border-stone-200 rounded-tl-none'
									}`}>
									<p className={`text-sm leading-relaxed ${message.type === 'user' ? 'text-white' : classes.text.primary}`}>
										{message.content}
									</p>
								</div>
								<span className={`text-xs ${classes.text.muted} mt-1 px-2`}>
									{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
						</div>
					</div>
				))}

				{loading && (
					<div className="flex justify-start">
						<div className="flex items-start max-w-[80%]">
							<div className="flex-shrink-0 mr-3">
								<div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
									🤖
								</div>
							</div>
							<div className={`rounded-2xl rounded-tl-none px-4 py-3 shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-stone-200'}`}>
								<div className="flex items-center space-x-2">
									<div className="flex space-x-1">
										<div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
										<div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
										<div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
									</div>
									<span className={`text-sm ${classes.text.secondary}`}>Thinking...</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Input Area */}
			<div className={`p-4 border-t ${classes.border.default} ${isDark ? 'bg-gray-900/50' : 'bg-stone-50/50'}`}>
				<form onSubmit={sendMessage} className="flex gap-2">
					<div className="flex-1 relative">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Type your cooking question..."
							className={`w-full px-4 py-3 pr-12 border ${classes.input.border} ${classes.input.bg} ${classes.input.text} ${classes.input.placeholder} rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm`}
							disabled={loading}
						/>
						<div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
							CHAT
						</div>
					</div>
					<button
						type="submit"
						disabled={loading || !input.trim()}
						className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg font-medium"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
						</svg>
					</button>
				</form>
				<p className={`text-xs ${classes.text.muted} mt-2 text-center`}>
					Powered by AI - Ask about recipes, cooking tips, ingredients & more
				</p>
			</div>
		</div>
	);
};

// Main Unified AI Features Component
const UnifiedAIFeatures = ({ mode = 'dashboard' }) => {
	const { classes, isDark } = useThemeAwareStyle();
	// Only dashboard mode now - removed booking workflow
	const [activeMode, setActiveMode] = useState('dashboard');

	// Define project-specific data
	const [cuisineOptions, setCuisineOptions] = useState([
		'North Indian', 'South Indian', 'Continental', 'Chinese',
		'Italian', 'Mexican', 'Thai', 'Japanese', 'Mediterranean',
		'Bengali', 'Punjabi', 'Gujarati', 'Maharashtrian', 'Tamil',
		'Kerala', 'Rajasthani', 'Hyderabadi'
	]);

	const [occasionOptions, setOccasionOptions] = useState([
		'Birthday Party', 'Anniversary', 'Wedding Reception',
		'Corporate Event', 'Dinner Party', 'Date Night',
		'Family Gathering', 'Festival Celebration', 'House Party'
	]);

	useEffect(() => {
		const fetchMetadata = async () => {
			try {
				const response = await axios.get(buildApiEndpoint('chefs/metadata'));
				if (response.data.success) {
					if (response.data.cuisines.length > 0) {
						setCuisineOptions(response.data.cuisines);
					}
					if (response.data.occasions && response.data.occasions.length > 0) {
						setOccasionOptions(response.data.occasions);
					}
				}
			} catch (error) {
				console.error('Failed to fetch chef metadata:', error);
			}
		};
		fetchMetadata();
	}, []);

	const dietaryOptions = [
		'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Diabetic-Friendly', 'Jain',
		'Halal', 'No Onion No Garlic', 'Low Sodium', 'Organic'
	];



	const mealTimeOptions = [
		'Breakfast', 'Brunch', 'Lunch', 'High Tea', 'Dinner', 'Late Night Snacks'
	];

	const serviceTypes = [
		{ id: 'birthday', name: 'Birthday Party', description: 'Birthday celebrations with custom menus' },
		{ id: 'marriage', name: 'Marriage Ceremony', description: 'Wedding ceremonies and receptions' },
		{ id: 'daily', name: 'Daily Cooking', description: 'Regular home cooking services' },
		{ id: 'corporate', name: 'Corporate Events', description: 'Business meetings and corporate functions' }
	];

	// State for user preferences and event details
	const [userPreferences, setUserPreferences] = useState({
		cuisine: '',
		budget: '',
		occasion: '',
		guests: '',
		dietary: ''
	});

	const [eventDetails, setEventDetails] = useState({
		serviceType: '',
		cuisine: '',
		guests: '',
		budget: '',
		mealTime: '',
		dietary: ''
	});

	const handleRecommendationsReceived = (recommendations) => {
	};

	const handleMenuGenerated = (menu) => {
	};

	return (
		<div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100'}`}>
			<div className="max-w-7xl mx-auto px-6 py-8">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent mb-4">
						🤖 AI-Powered Chef Platform
					</h1>
					<p className={`text-xl ${classes.text.secondary} mb-6`}>
						Experience the future of chef booking with AI recommendations and menu generation
					</p>
				</div>

				{/* AI Features Dashboard Content */}
				<div className="container mx-auto px-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
						{/* Chef Recommendations Section - Left Column */}
						<div>
							<div className="mb-4">
								<h2 className={`text-2xl font-semibold ${classes.text.heading}`}>Smart Chef Recommendations</h2>
								<p className={`text-sm ${classes.text.secondary}`}>
									Personalized matches based on your profile & location
								</p>
							</div>
							<AIChefRecommendations
								onGetRecommendations={handleRecommendationsReceived}
							/>
						</div>


						{/* Right Column: Menu Gen + Chat */}
						<div className="space-y-8">
							{/* Menu Generation Section */}
							<div>

								<h2 className={`text-2xl font-semibold mb-4 ${classes.text.heading}`}>Menu Generation</h2>
								<div className={`${classes.bg.card} rounded-lg shadow-lg p-6 mb-6 border ${classes.border.default}`}>
									<h3 className={`text-lg font-medium mb-4 ${classes.text.heading}`}>Event Details</h3>
									<div className="space-y-4">
										<div>
											<label className={`block text-sm font-medium ${classes.text.primary} mb-1`}>Service Type</label>
											<select
												value={eventDetails.serviceType}
												onChange={(e) => setEventDetails({ ...eventDetails, serviceType: e.target.value })}
												className={`w-full px-3 py-2 border ${classes.input.border} ${classes.input.bg} ${classes.input.text} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
											>
												<option value="">Select service type</option>
												{serviceTypes.map(service => (
													<option key={service.id} value={service.id}>
														{service.name} - {service.description}
													</option>
												))}
											</select>
										</div>
										<div>
											<label className={`block text-sm font-medium ${classes.text.primary} mb-1`}>Cuisine</label>
											<select
												value={eventDetails.cuisine}
												onChange={(e) => setEventDetails({ ...eventDetails, cuisine: e.target.value })}
												className={`w-full px-3 py-2 border ${classes.input.border} ${classes.input.bg} ${classes.input.text} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
											>
												<option value="">Select cuisine</option>
												{cuisineOptions.map(cuisine => (
													<option key={cuisine} value={cuisine}>{cuisine}</option>
												))}
											</select>
										</div>
										<div>
											<label className={`block text-sm font-medium ${classes.text.primary} mb-1`}>Guests</label>
											<input
												type="number"
												value={eventDetails.guests}
												onChange={(e) => setEventDetails({ ...eventDetails, guests: e.target.value })}
												placeholder="Number of guests"
												className={`w-full px-3 py-2 border ${classes.input.border} ${classes.input.bg} ${classes.input.text} ${classes.input.placeholder} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
											/>
										</div>
										<div>
											<label className={`block text-sm font-medium ${classes.text.primary} mb-1`}>Budget (Rs.)</label>
											<input
												type="number"
												value={eventDetails.budget}
												onChange={(e) => setEventDetails({ ...eventDetails, budget: e.target.value })}
												placeholder="Total budget"
												className={`w-full px-3 py-2 border ${classes.input.border} ${classes.input.bg} ${classes.input.text} ${classes.input.placeholder} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
											/>
										</div>
										<div>
											<label className={`block text-sm font-medium ${classes.text.primary} mb-1`}>Meal Time</label>
											<select
												value={eventDetails.mealTime}
												onChange={(e) => setEventDetails({ ...eventDetails, mealTime: e.target.value })}
												className={`w-full px-3 py-2 border ${classes.input.border} ${classes.input.bg} ${classes.input.text} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
											>
												<option value="">Select meal time</option>
												{mealTimeOptions.map(mealTime => (
													<option key={mealTime} value={mealTime}>{mealTime}</option>
												))}
											</select>
										</div>
										<div>
											<label className={`block text-sm font-medium ${classes.text.primary} mb-1`}>Dietary Restrictions</label>
											<select
												value={eventDetails.dietary}
												onChange={(e) => setEventDetails({ ...eventDetails, dietary: e.target.value })}
												className={`w-full px-3 py-2 border ${classes.input.border} ${classes.input.bg} ${classes.input.text} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
											>
												<option value="">No dietary restrictions</option>
												{dietaryOptions.map(diet => (
													<option key={diet} value={diet}>{diet}</option>
												))}
											</select>
										</div>
									</div>
								</div>
								<AIMenuGenerator
									eventDetails={eventDetails}
									onMenuGenerated={handleMenuGenerated}
								/>
							</div>


							{/* AI Chat Assistant */}
							<div>
								<h2 className={`text-2xl font-semibold mb-4 ${classes.text.heading}`}>AI Chat Assistant</h2>

								<div className={`${classes.bg.card} rounded-lg shadow-lg p-6 border ${classes.border.default}`}>

									<AIChatAssistant />
								</div>
							</div>
						</div>
					</div>
				</div >
			</div >
		</div >
	);
};

export default UnifiedAIFeatures;
export { AIMenuGenerator, AIChatAssistant, AIChefRecommendations };
