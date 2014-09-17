package pt.uc.dei.nobugssnackbar.dao;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.logging.Logger;

import pt.uc.dei.nobugssnackbar.model.User;

public class NoBugsConnection {
	
	private static Logger log = Logger.getGlobal();
	
	public static NoBugsConnection getConnection() {
		return conn;
	}
	
	public static void buildConnection(String url, String className, String username, String password) throws ClassNotFoundException, SQLException {
		if (conn == null) {
			conn = new NoBugsConnection(url, className, username, password);
			log.info("Connected successfull");
			
		}

	}
	
	private static NoBugsConnection conn;
	
	private Connection bdCon;
	
	private NoBugsConnection(String url, String className, String username, String password) throws ClassNotFoundException, SQLException {	
		
		Class.forName(className);
		this.bdCon = DriverManager.getConnection (url, username, password);
		
	}

	public User login(String nick, String passw) throws Exception {
		PreparedStatement ps = bdCon.prepareStatement("select userid, usernick, userpassw, usermoney from users where usernick = ? and userpassw = ?");
		ps.setString(1, nick);
		ps.setString(2, passw);
		
		ResultSet rs = ps.executeQuery();
		if (!rs.next()) {
			throw new Exception("User not found");
		}
		
		User u = new User();
		u.setId(rs.getLong(1));
		u.setNick(nick);
		u.setPassw(passw);
		u.setMoney(rs.getLong(4));
		
		ps.close();
		return u;
	}

	public void insertMission(String name, String xml) throws SQLException {

		PreparedStatement ps = bdCon.prepareStatement("insert into missions (missionname, missioncontent) values (?, ?)");
		ps.setString(1, name);
		ps.setString(2, xml);
		
		ps.executeUpdate();
		ps.close();
	}

	public String[][] loadMission(User user) throws SQLException {
		
		String query =
				"SELECT cm.missionid, cm.classid"+ 
			    "    FROM classesmissions cm LEFT OUTER JOIN missionsaccomplished ma ON cm.missionid = ma.missionid AND ma.userid = ?"+ 
			    "    WHERE  (ma.missionid IS NULL OR ma.achieved = 'F')  AND cm.classid IN (SELECT classid FROM classesusers uc WHERE uc.userid = ?)"+ 
			    "    ORDER BY missionorder";
			
		PreparedStatement ps = bdCon.prepareStatement(query);
		ps.setLong(1, user.getId());
		ps.setLong(2, user.getId());
		
		ResultSet rs = ps.executeQuery();
		boolean hasMoreMissions = rs.next();
		if (!hasMoreMissions) {
			ps.close();
			return null;
		}
		
		long missionId = rs.getLong(1);
		ps.close();
		
		// TODO se o usuario pertence a mais de uma classe, ele precisa selecionar quais das missoes ele deseja fazer
		Statement st = bdCon.createStatement();
		rs = st.executeQuery("SELECT missioncontent FROM missions WHERE missionid = " + missionId);
		rs.next();
		
		String xml = rs.getString(1);
		st.close();
		
		String[][] ret = new String[1][2];
		ret[0][0] = missionId + "";
		ret[0][1] = xml;
		
		return ret;
		
	}

	public void finishMission(User user, long idMission, int money, int timeSpend, boolean achieved) throws SQLException {
		
		Statement st = bdCon.createStatement();
		ResultSet rs = st.executeQuery("select timespend from missionsaccomplished where missionid = "+idMission+" and userid = "+user.getId());
		boolean found = (rs.next());
		if (found)
			timeSpend += rs.getInt(1);
		st.close();
		
		PreparedStatement ps;
		if (found) {
			ps = bdCon.prepareStatement("update missionsaccomplished set timespend = ?, achieved = ?, money = ? "
					+ "where missionid = ? and userid = ?");
		} else {
			ps = bdCon.prepareStatement("insert into missionsaccomplished "
					+ "(timespend, achieved, money, missionid, userid) values (?, ?, ?, ?, ?)");
		}
		
		ps.setLong(1, timeSpend);
		ps.setString(2, (achieved?"T":"F"));
		ps.setInt(3, money);
		ps.setLong(4, idMission);
		ps.setLong(5, user.getId());
		
		ps.executeUpdate();
		ps.close();
		if (achieved) {
			ps = bdCon.prepareStatement("update users set usermoney = ? where userid = ?");
			ps.setLong(1, user.getMoney());
			ps.setLong(2, user.getId());
			ps.executeUpdate();
			ps.close();
		}
		
	}

	public void updateMission(int idMission, String xml) throws SQLException {
		PreparedStatement ps = bdCon.prepareStatement("update missions set missioncontent = ? where missionid = ?");
		ps.setString(1, xml);
		ps.setInt(2, idMission);
		
		ps.executeUpdate();
		ps.close();		
	}
	
}
