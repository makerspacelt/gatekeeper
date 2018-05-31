#!/usr/bin/lua

require "luci.jsonc"

local reqId = arg[1]

if reqId == nil or reqId == "" then
	print("Invalid id requested")
	os.exit(99)
end

file = io.open("/etc/gatekeeper/db.json", "r")
if not file then
	print("Database file not found")
	os.exit(99)
end


parser = luci.jsonc.new()
parser:parse(file:read("*all"))
data = parser:get()
file:close()

function getUserByCard(reqCardId)
	for userHash, userObject in pairs(data.users) do
		local cards = userObject.cards
		for cardId, cardObject in pairs(cards) do
			if reqCardId == cardId then
			return userHash, userObject, cardObject
			end
		end
	end
	return nil
end


local userHash, user, card = getUserByCard(reqId)

if not userHash then
	print("Card " .. reqId .. " was not found!")
	os.exit(1)
end

if not card.active then
	print("Card " .. reqId .. " is disabled!")
	os.exit(2)
end

if not user.active then
	print("User " .. userHash .. " is disabled!")
	os.exit(3)
end

print(userHash)
