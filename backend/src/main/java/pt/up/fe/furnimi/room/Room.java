package pt.up.fe.furnimi.room;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "room")
@Getter
@Setter
@NoArgsConstructor
public class Room {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 255)
	private String name;

	@Column(name = "width_cm", nullable = false)
	private int widthCm;

	@Column(name = "length_cm", nullable = false)
	private int lengthCm;

	public Room(String name, int widthCm, int lengthCm) {
		this.name = name;
		this.widthCm = widthCm;
		this.lengthCm = lengthCm;
	}

}
