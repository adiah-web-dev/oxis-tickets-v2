from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class LoginSerializer(TokenObtainPairSerializer):
	@classmethod
	def get_token(cls, user):
		token = super().get_token(user)

		# Custom claims available in the JWT payload
		token['email'] = user.email
		token['role'] = user.role
		token['first_name'] = user.first_name
		token['last_name'] = user.last_name

		return token

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = [
			'id',
			'email',
			'first_name',
			'last_name',
			'role'
		]
		read_only_fields = ['id', 'email', 'role']
